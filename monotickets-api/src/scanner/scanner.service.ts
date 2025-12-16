import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScanValidationDto } from './dto/scan-validation.dto';
import { SyncScansDto } from './dto/sync-scans.dto';
import { ScanStatus, EventStatus, RsvpStatus } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

interface JWTPayload {
  iss: string;
  sub: string; // invitationId
  eventId: string;
  guestId: string;
  iat: number;
  nbf: number;
  exp: number;
}

@Injectable()
export class ScannerService {
  constructor(private prisma: PrismaService) {}

  async validateQR(dto: ScanValidationDto) {
    const jwtSecret =
      process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    // Step 1: Decode and verify JWT
    let payload: JWTPayload;
    try {
      payload = jwt.verify(dto.qrToken, jwtSecret, {
        algorithms: ['HS256'],
        issuer: 'monotickets-platinum',
      }) as JWTPayload;
    } catch (error: any) {
      return {
        valid: false,
        status: ScanStatus.INVALID,
        message:
          error.name === 'TokenExpiredError'
            ? 'QR expirado - Solo válido el día del evento'
            : 'QR inválido o corrupto',
      };
    }

    const invitationId = payload.sub;

    // Step 2: Get invitation with guest and event data
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
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

    // Step 3: Verify event matches
    if (invitation.eventId !== dto.eventId) {
      return {
        valid: false,
        status: ScanStatus.INVALID,
        message: 'QR no pertenece a este evento',
      };
    }

    // Step 4: Check if event is BLOCKED (highest priority)
    if (invitation.event.status === EventStatus.BLOCKED) {
      return {
        valid: false,
        status: ScanStatus.EVENT_BLOCKED,
        message: 'Evento bloqueado por el Director Global',
      };
    }

    // Step 5: Check if invitation was revoked
    if (invitation.revokedAt) {
      return {
        valid: false,
        status: ScanStatus.REVOKED,
        message: 'Invitación revocada',
      };
    }

    // Step 6: Check RSVP status
    if (
      invitation.guest.rsvpStatus === RsvpStatus.PENDING ||
      invitation.guest.rsvpStatus === RsvpStatus.DECLINED
    ) {
      return {
        valid: false,
        status: ScanStatus.NOT_CONFIRMED,
        guest: {
          id: invitation.guest.id,
          fullName: invitation.guest.fullName,
          guestCount: invitation.guest.guestCount,
          rsvpStatus: invitation.guest.rsvpStatus,
        },
        message: 'Invitado no ha confirmado asistencia',
      };
    }

    // Step 7: Check remaining count (partial entry)
    if (invitation.remainingCount <= 0) {
      return {
        valid: false,
        status: ScanStatus.DUPLICATE,
        guest: {
          id: invitation.guest.id,
          fullName: invitation.guest.fullName,
          guestCount: invitation.guest.guestCount,
        },
        message: 'Todas las personas de esta invitación ya ingresaron',
      };
    }

    // Step 8: Check if partial entry needed
    if (invitation.guest.guestCount > 1) {
      // Return guest list for staff to select who enters
      return {
        valid: true,
        status: ScanStatus.VALID_PARTIAL,
        requiresSelection: true,
        guest: {
          id: invitation.guest.id,
          fullName: invitation.guest.fullName,
          guestCount: invitation.guest.guestCount,
          remainingCount: invitation.remainingCount,
        },
        invitation: {
          id: invitation.id,
        },
        message: `Invitación grupal - ${invitation.remainingCount} de ${invitation.guest.guestCount} personas pendientes`,
      };
    }

    // Step 9: Single person entry - auto confirm
    const scan = await this.prisma.$transaction(async (tx) => {
      // Create scan record
      const newScan = await tx.scan.create({
        data: {
          qrToken: dto.qrToken,
          invitationId: invitation.id,
          eventId: dto.eventId,
          scannedBy: dto.scannedBy,
          status: ScanStatus.VALID_FULL,
          enteredNames: [invitation.guest.fullName],
          remainingCountAfter: 0,
          scannedAt: new Date(dto.scannedAt),
        },
      });

      // Update invitation remaining count
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { remainingCount: 0 },
      });

      return newScan;
    });

    return {
      valid: true,
      status: ScanStatus.VALID_FULL,
      guest: {
        id: invitation.guest.id,
        fullName: invitation.guest.fullName,
        guestCount: invitation.guest.guestCount,
      },
      scan: {
        id: scan.id,
        scannedAt: scan.scannedAt,
        scannedBy: scan.scannedBy,
      },
      message: 'Acceso permitido',
    };
  }

  async confirmPartialEntry(
    invitationId: string,
    enteredNames: string[],
    scannedBy: string,
  ) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        guest: true,
        event: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (enteredNames.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos una persona');
    }

    if (enteredNames.length > invitation.remainingCount) {
      throw new BadRequestException(
        `Solo quedan ${invitation.remainingCount} personas por ingresar`,
      );
    }

    const newRemainingCount = invitation.remainingCount - enteredNames.length;
    const isFullyUsed = newRemainingCount === 0;

    const scan = await this.prisma.$transaction(async (tx) => {
      // Create scan record
      const newScan = await tx.scan.create({
        data: {
          qrToken: null, // JWT not stored
          invitationId: invitation.id,
          eventId: invitation.eventId,
          scannedBy,
          status: isFullyUsed
            ? ScanStatus.VALID_FULL
            : ScanStatus.VALID_PARTIAL,
          enteredNames,
          remainingCountAfter: newRemainingCount,
          scannedAt: new Date(),
        },
      });

      // Update invitation remaining count
      await tx.invitation.update({
        where: { id: invitationId },
        data: {
          remainingCount: newRemainingCount,
          status: isFullyUsed ? 'FULLY_USED' : 'PARTIALLY_USED',
        },
      });

      return newScan;
    });

    return {
      success: true,
      scan: {
        id: scan.id,
        enteredNames: scan.enteredNames,
        remainingCount: newRemainingCount,
        status: scan.status,
      },
      message: isFullyUsed
        ? 'Acceso permitido - Invitación completamente usada'
        : `Acceso permitido - Quedan ${newRemainingCount} personas`,
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
      invitationId: scan.invitationId,
      eventId: scan.eventId,
      guestId: scan.invitation?.guest.id,
      guestName: scan.invitation?.guest.fullName || 'Unknown',
      guestCount: scan.invitation?.guest.guestCount || 1,
      enteredNames: scan.enteredNames,
      remainingCountAfter: scan.remainingCountAfter,
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
