import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { isWithinEventDay, endOfDayInCDMX } from '../common/utils/timezone.util';

/**
 * QR Service for generating and validating JWT-based QR codes
 * QR codes are valid only on the event day (00:00-23:59 CDMX)
 */
@Injectable()
export class QrService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    /**
     * Generate QR token for an invitation
     * Token is valid only on the event day
     */
    async generateQrToken(invitationId: string): Promise<string> {
        const invitation = await this.prisma.invitation.findUnique({
            where: { id: invitationId },
            include: {
                event: true,
                guest: true,
            },
        });

        if (!invitation) {
            throw new UnauthorizedException('Invitation not found');
        }

        // Calculate expiration: end of event day in CDMX
        const expiresAt = endOfDayInCDMX(invitation.event.date);

        // Create JWT payload with minimal claims
        const payload = {
            invitationId: invitation.id,
            eventId: invitation.event.id,
            guestId: invitation.guest.id,
            guestCount: invitation.guest.guestCount,
            remainingCount: invitation.remainingCount,
            eventDate: invitation.event.date.toISOString(),
        };

        // Sign token with expiration
        const token = this.jwtService.sign(payload, {
            expiresAt: Math.floor(expiresAt.getTime() / 1000),
        });

        return token;
    }

    /**
     * Validate QR token
     * Checks: signature, expiration, and event day in CDMX timezone
     */
    async validateQrToken(token: string): Promise<{
        valid: boolean;
        payload?: any;
        reason?: string;
    }> {
        try {
            // Verify JWT signature
            const payload = this.jwtService.verify(token);

            // Check if current time is within event day (CDMX)
            const eventDate = new Date(payload.eventDate);
            const withinEventDay = isWithinEventDay(eventDate);

            if (!withinEventDay) {
                return {
                    valid: false,
                    reason: 'QR code is only valid on the event day',
                };
            }

            // Verify invitation still exists and is valid
            const invitation = await this.prisma.invitation.findUnique({
                where: { id: payload.invitationId },
                include: {
                    guest: true,
                    event: true,
                },
            });

            if (!invitation) {
                return {
                    valid: false,
                    reason: 'Invitation not found',
                };
            }

            // Check if guest confirmed RSVP
            if (invitation.guest.rsvpStatus !== 'CONFIRMED') {
                return {
                    valid: false,
                    reason: 'Guest has not confirmed attendance',
                };
            }

            return {
                valid: true,
                payload: {
                    ...payload,
                    guestName: invitation.guest.fullName,
                    eventName: invitation.event.name,
                    currentRemainingCount: invitation.remainingCount,
                },
            };
        } catch (error) {
            return {
                valid: false,
                reason: error.message || 'Invalid or expired token',
            };
        }
    }

    /**
     * Get QR token by invitation token (for public access)
     */
    async getQrByInvitationToken(invitationToken: string): Promise<string> {
        const invitation = await this.prisma.invitation.findUnique({
            where: { qrToken: invitationToken },
        });

        if (!invitation) {
            throw new UnauthorizedException('Invitation not found');
        }

        return this.generateQrToken(invitation.id);
    }
}
