import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScanValidationDto } from './dto/scan-validation.dto';
import { SyncScansDto } from './dto/sync-scans.dto';
import { ScanStatus } from '@prisma/client';

@Injectable()
export class ScannerService {
    constructor(private prisma: PrismaService) { }

    async validateQR(dto: ScanValidationDto) {
        // Find invitation by QR token
        const invitation = await this.prisma.invitation.findUnique({
            where: { qrToken: dto.qrToken },
            include: {
                guest: true,
                event: true,
            },
        });

        if (!invitation) {
            return {
                valid: false,
                status: ScanStatus.INVALID,
                message: 'QR inválido o no encontrado',
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

        // Check if already scanned
        const existingScan = await this.prisma.scan.findFirst({
            where: {
                qrToken: dto.qrToken,
                eventId: dto.eventId,
            },
        });

        if (existingScan) {
            return {
                valid: false,
                status: ScanStatus.DUPLICATE,
                guest: {
                    id: invitation.guest.id,
                    fullName: invitation.guest.fullName,
                    guestCount: invitation.guest.guestCount,
                    inviteType: 'STANDARD',
                },
                message: `Ya escaneado anteriormente a las ${existingScan.scannedAt.toLocaleTimeString('es-MX')}`,
            };
        }

        // Create scan record
        const scan = await this.prisma.scan.create({
            data: {
                qrToken: dto.qrToken,
                eventId: dto.eventId,
                scannedBy: dto.scannedBy,
                status: ScanStatus.VALID,
                scannedAt: new Date(dto.scannedAt),
            },
        });

        return {
            valid: true,
            status: ScanStatus.VALID,
            guest: {
                id: invitation.guest.id,
                fullName: invitation.guest.fullName,
                guestCount: invitation.guest.guestCount,
                inviteType: 'STANDARD',
            },
            scan: {
                id: scan.id,
                scannedAt: scan.scannedAt,
                scannedBy: scan.scannedBy,
            },
            message: 'Acceso permitido',
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
