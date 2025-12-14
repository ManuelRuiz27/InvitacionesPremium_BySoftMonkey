import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScanValidationDto } from './dto/scan-validation.dto';
import { SyncScansDto } from './dto/sync-scans.dto';
import { ScanStatus } from '@prisma/client';
import { QrService } from '../common/services/qr.service';

@Injectable()
export class ScannerService {
    constructor(
        private prisma: PrismaService,
        private qrService: QrService,
    ) { }

    /**
     * Validate and scan QR code with partial entry support
     * @param dto - Scan validation data
     * @param entryCount - Number of people entering (for partial entry)
     */
    async validateQR(dto: ScanValidationDto, entryCount?: number) {
        // First, validate JWT token
        const qrValidation = await this.qrService.validateQrToken(dto.qrToken);

        if (!qrValidation.valid) {
            return {
                valid: false,
                status: qrValidation.reason?.includes('expired') || qrValidation.reason?.includes('event day')
                    ? ScanStatus.EXPIRED
                    : ScanStatus.INVALID,
                message: qrValidation.reason || 'QR inválido',
            };
        }

        const payload = qrValidation.payload;

        // Find invitation by ID from JWT
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
                status: ScanStatus.INVALID,
                message: 'Invitación no encontrada',
            };
        }

        // Verify event matches
        if (invitation.eventId !== dto.eventId) {
            return {
                valid: false,
                status: ScanStatus.INVALID,
                message: 'QR no pertenece a este evento',
            };
        }

        // Check remaining count
        if (invitation.remainingCount <= 0) {
            return {
                valid: false,
                status: ScanStatus.DUPLICATE,
                guest: {
                    id: invitation.guest.id,
                    fullName: invitation.guest.fullName,
                    guestCount: invitation.guest.guestCount,
                    remainingCount: invitation.remainingCount,
                },
                message: 'Todos los invitados ya ingresaron',
            };
        }

        // Determine entry count (default to remaining count if not specified)
        const actualEntryCount = entryCount || invitation.remainingCount;

        // Validate entry count
        if (actualEntryCount > invitation.remainingCount) {
            throw new BadRequestException(
                `Cannot enter ${actualEntryCount} people. Only ${invitation.remainingCount} remaining.`,
            );
        }

        if (actualEntryCount < 1) {
            throw new BadRequestException('Entry count must be at least 1');
        }

        // Transactional update to prevent race conditions
        const result = await this.prisma.$transaction(async (tx) => {
            // Update remaining count
            const updatedInvitation = await tx.invitation.update({
                where: { id: invitation.id },
                data: {
                    remainingCount: invitation.remainingCount - actualEntryCount,
                },
            });

            // Create scan record
            const scan = await tx.scan.create({
                data: {
                    qrToken: dto.qrToken,
                    eventId: dto.eventId,
                    scannedBy: dto.scannedBy,
                    status: ScanStatus.VALID,
                    scannedAt: new Date(dto.scannedAt),
                },
            });

            return { updatedInvitation, scan };
        });

        return {
            valid: true,
            status: ScanStatus.VALID,
            guest: {
                id: invitation.guest.id,
                fullName: invitation.guest.fullName,
                guestCount: invitation.guest.guestCount,
                remainingCount: result.updatedInvitation.remainingCount,
                enteredCount: actualEntryCount,
            },
            scan: {
                id: result.scan.id,
                scannedAt: result.scan.scannedAt,
                scannedBy: result.scan.scannedBy,
            },
            message: actualEntryCount === invitation.guest.guestCount
                ? 'Acceso permitido - Todos los invitados'
                : `Acceso permitido - ${actualEntryCount} de ${invitation.guest.guestCount} invitados`,
        };
    }

    async getScanHistory(eventId: string) {
        const scans = await this.prisma.scan.findMany({
            where: { eventId },
            include: {
                invitation: {
                    include: {
                        guest: true,
                    },
                },
            },
            orderBy: { scannedAt: 'desc' },
            take: 100, // Limit to last 100 scans
        });

        return scans.map((scan) => ({
            id: scan.id,
            qrToken: scan.qrToken,
            eventId: scan.eventId,
            guestId: scan.invitation.guest.id,
            guestName: scan.invitation.guest.fullName,
            guestCount: scan.invitation.guest.guestCount,
            status: scan.status,
            scannedAt: scan.scannedAt,
            scannedBy: scan.scannedBy,
            synced: true,
        }));
    }

    async syncOfflineScans(dto: SyncScansDto) {
        const results: Array<{
            localId: string;
            serverId?: string;
            success: boolean;
            status?: ScanStatus;
            error?: string;
        }> = [];
        let synced = 0;
        let failed = 0;

        for (const offlineScan of dto.scans) {
            try {
                const result = await this.validateQR({
                    qrToken: offlineScan.qrToken,
                    eventId: offlineScan.eventId,
                    scannedBy: offlineScan.scannedBy,
                    scannedAt: offlineScan.scannedAt,
                });

                results.push({
                    localId: offlineScan.id,
                    serverId: result.scan?.id,
                    success: result.valid,
                    status: result.status,
                });

                if (result.valid) synced++;
                else failed++;
            } catch (error: any) {
                results.push({
                    localId: offlineScan.id,
                    success: false,
                    error: error.message,
                });
                failed++;
            }
        }

        return { synced, failed, results };
    }
}
