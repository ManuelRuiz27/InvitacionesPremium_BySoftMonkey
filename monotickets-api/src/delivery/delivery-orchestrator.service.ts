import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryProvider, DeliveryResult } from './providers/delivery-provider.interface';
import { InvitationStatus } from '@prisma/client';
import { nowInCDMX } from '../common/utils/timezone.util';

interface DeliveryAttemptResult {
    channel: string;
    success: boolean;
    providerId?: string;
    error?: string;
    invalidNumber?: boolean;
    attemptNumber: number;
}

/**
 * Delivery Orchestrator
 * Implements dual-channel delivery (SMS + WhatsApp) with retry logic
 * - Sends via both channels in parallel
 * - Retries up to 3 times per channel with exponential backoff
 * - Marks numbers as invalid if provider indicates
 * - Sets receivedAt on first successful delivery
 */
@Injectable()
export class DeliveryOrchestratorService {
    private readonly logger = new Logger(DeliveryOrchestratorService.name);
    private readonly MAX_RETRIES = 3;
    private readonly BASE_DELAY_MS = 1000; // 1 second base delay

    constructor(
        private prisma: PrismaService,
        private smsProvider: DeliveryProvider,
        private whatsappProvider: DeliveryProvider,
    ) { }

    /**
     * Send invitation via dual-channel with retries
     * @param invitationId - Invitation to send
     * @returns Delivery summary
     */
    async sendInvitation(invitationId: string): Promise<{
        success: boolean;
        channels: DeliveryAttemptResult[];
        invalidNumber: boolean;
    }> {
        // Get invitation with guest info
        const invitation = await this.prisma.invitation.findUnique({
            where: { id: invitationId },
            include: {
                guest: true,
                event: true,
            },
        });

        if (!invitation) {
            throw new Error(`Invitation ${invitationId} not found`);
        }

        if (!invitation.guest.phone) {
            throw new Error(`Guest ${invitation.guest.id} has no phone number`);
        }

        // Prepare message
        const message = this.buildMessage(invitation);

        // Send via both channels in parallel
        const [smsResults, whatsappResults] = await Promise.all([
            this.sendWithRetry(
                this.smsProvider,
                invitation.guest.phone,
                message,
                { invitationId, eventId: invitation.eventId },
            ),
            this.sendWithRetry(
                this.whatsappProvider,
                invitation.guest.phone,
                message,
                { invitationId, eventId: invitation.eventId },
            ),
        ]);

        // Check if any channel succeeded
        const anySuccess = smsResults.some((r) => r.success) || whatsappResults.some((r) => r.success);

        // Check if number is invalid (both channels report invalid)
        const invalidNumber =
            smsResults.some((r) => r.invalidNumber) && whatsappResults.some((r) => r.invalidNumber);

        // Update invitation status
        if (anySuccess) {
            await this.prisma.invitation.update({
                where: { id: invitationId },
                data: {
                    status: InvitationStatus.DELIVERED,
                    deliveredAt: nowInCDMX(),
                    receivedAt: nowInCDMX(), // Set receivedAt on first successful delivery
                },
            });
        } else if (invalidNumber) {
            await this.prisma.invitation.update({
                where: { id: invitationId },
                data: {
                    status: InvitationStatus.FAILED,
                },
            });
        } else {
            await this.prisma.invitation.update({
                where: { id: invitationId },
                data: {
                    status: InvitationStatus.FAILED,
                },
            });
        }

        return {
            success: anySuccess,
            channels: [...smsResults, ...whatsappResults],
            invalidNumber,
        };
    }

    /**
     * Send with retry logic (up to 3 attempts with exponential backoff)
     */
    private async sendWithRetry(
        provider: DeliveryProvider,
        to: string,
        message: string,
        metadata: Record<string, any>,
    ): Promise<DeliveryAttemptResult[]> {
        const results: DeliveryAttemptResult[] = [];

        if (!provider.isAvailable()) {
            this.logger.warn(`Provider ${provider.getName()} is not available`);
            return results;
        }

        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                const result = await provider.send(to, message, metadata);

                const attemptResult: DeliveryAttemptResult = {
                    channel: provider.getName(),
                    success: result.success,
                    providerId: result.providerId,
                    error: result.error,
                    invalidNumber: result.invalidNumber,
                    attemptNumber: attempt,
                };

                results.push(attemptResult);

                // Log attempt to database
                await this.logDeliveryAttempt(metadata.invitationId, attemptResult);

                // If successful or invalid number, stop retrying
                if (result.success || result.invalidNumber) {
                    break;
                }

                // Exponential backoff before retry
                if (attempt < this.MAX_RETRIES) {
                    const delay = this.BASE_DELAY_MS * Math.pow(2, attempt - 1);
                    this.logger.log(
                        `Retrying ${provider.getName()} after ${delay}ms (attempt ${attempt}/${this.MAX_RETRIES})`,
                    );
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            } catch (error) {
                this.logger.error(`Error sending via ${provider.getName()}:`, error);
                results.push({
                    channel: provider.getName(),
                    success: false,
                    error: error.message,
                    attemptNumber: attempt,
                });
            }
        }

        return results;
    }

    /**
     * Log delivery attempt to database
     */
    private async logDeliveryAttempt(
        invitationId: string,
        result: DeliveryAttemptResult,
    ): Promise<void> {
        try {
            await this.prisma.deliveryAttempt.create({
                data: {
                    invitationId,
                    method: result.channel,
                    status: result.success ? 'SUCCESS' : 'FAILED',
                    providerId: result.providerId,
                    errorMessage: result.error,
                    attemptedAt: nowInCDMX(),
                },
            });
        } catch (error) {
            this.logger.error('Failed to log delivery attempt:', error);
        }
    }

    /**
     * Build invitation message
     */
    private buildMessage(invitation: any): string {
        const eventName = invitation.event.name;
        const eventDate = new Date(invitation.event.date).toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const guestName = invitation.guest.fullName;

        // In production, this would include a link to the invitation landing page
        const invitationLink = `https://monotickets.com/invitation/${invitation.qrToken}`;

        return `Hola ${guestName}! 🎉\n\n` +
            `Estás invitado/a a: ${eventName}\n` +
            `Fecha: ${eventDate}\n\n` +
            `Ver invitación: ${invitationLink}\n\n` +
            `¡Te esperamos!`;
    }

    /**
     * Bulk send invitations
     */
    async sendBulk(invitationIds: string[]): Promise<{
        total: number;
        successful: number;
        failed: number;
        invalidNumbers: number;
    }> {
        let successful = 0;
        let failed = 0;
        let invalidNumbers = 0;

        for (const invitationId of invitationIds) {
            try {
                const result = await this.sendInvitation(invitationId);

                if (result.success) {
                    successful++;
                } else if (result.invalidNumber) {
                    invalidNumbers++;
                } else {
                    failed++;
                }
            } catch (error) {
                this.logger.error(`Failed to send invitation ${invitationId}:`, error);
                failed++;
            }
        }

        return {
            total: invitationIds.length,
            successful,
            failed,
            invalidNumbers,
        };
    }
}
