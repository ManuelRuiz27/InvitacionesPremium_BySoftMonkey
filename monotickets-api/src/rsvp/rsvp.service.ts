import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RsvpConfigDto } from './dto/rsvp-config.dto';
import { RsvpStatus } from '@prisma/client';
import { addDaysInCDMX, nowInCDMX } from '../common/utils/timezone.util';

@Injectable()
export class RsvpService {
    constructor(private prisma: PrismaService) { }

    async getConfig(eventId: string) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            throw new NotFoundException(`Event with ID ${eventId} not found`);
        }

        // In production, this would query an rsvp_config table
        // For now, we'll return a default config
        return {
            eventId,
            enabled: true,
            deadline: event.date,
            message: 'Por favor confirma tu asistencia',
            allowPlusOnes: true,
        };
    }

    async createConfig(configDto: RsvpConfigDto) {
        const event = await this.prisma.event.findUnique({
            where: { id: configDto.eventId },
        });

        if (!event) {
            throw new NotFoundException(`Event with ID ${configDto.eventId} not found`);
        }

        // In production, this would create a record in rsvp_config table
        // For now, we'll return the config as-is
        return {
            id: event.id,
            ...configDto,
            createdAt: new Date(),
        };
    }

    async getConfirmations(eventId: string) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            throw new NotFoundException(`Event with ID ${eventId} not found`);
        }

        const guests = await this.prisma.guest.findMany({
            where: { eventId },
            orderBy: { updatedAt: 'desc' },
        });

        const confirmed = guests.filter(g => g.rsvpStatus === 'CONFIRMED');
        const declined = guests.filter(g => g.rsvpStatus === 'DECLINED');
        const pending = guests.filter(g => g.rsvpStatus === 'PENDING');

        return {
            eventId,
            total: guests.length,
            confirmed: confirmed.length,
            declined: declined.length,
            pending: pending.length,
            confirmationRate: guests.length > 0 ? (confirmed.length / guests.length) * 100 : 0,
            guests: guests.map(g => ({
                id: g.id,
                fullName: g.fullName,
                email: g.email,
                phone: g.phone,
                guestCount: g.guestCount,
                rsvpStatus: g.rsvpStatus,
                updatedAt: g.updatedAt,
            })),
        };
    }

    /**
     * Update guest RSVP status
     * Enforces 20-day revocation window from receivedAt
     * Planner can override manually
     */
    async updateRsvp(
        guestId: string,
        status: RsvpStatus,
        isPlannerOverride: boolean = false,
    ) {
        const guest = await this.prisma.guest.findUnique({
            where: { id: guestId },
            include: {
                invitations: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!guest) {
            throw new NotFoundException(`Guest with ID ${guestId} not found`);
        }

        // Check if guest can revoke RSVP (20-day window)
        if (!isPlannerOverride && guest.rsvpStatus !== RsvpStatus.PENDING) {
            const canRevoke = this.canRevokeRsvp(guest.invitations[0]?.receivedAt);
            if (!canRevoke) {
                throw new BadRequestException(
                    'Cannot change RSVP after 20 days from invitation receipt',
                );
            }
        }

        // Update RSVP status
        const updatedGuest = await this.prisma.guest.update({
            where: { id: guestId },
            data: {
                rsvpStatus: status,
                respondedAt: guest.respondedAt || nowInCDMX(),
            },
        });

        return updatedGuest;
    }

    /**
     * Check if guest can revoke RSVP based on 20-day window
     * @param receivedAt - When the invitation was first received
     * @returns true if within 20 days, false otherwise
     */
    private canRevokeRsvp(receivedAt: Date | null | undefined): boolean {
        if (!receivedAt) {
            // If no receivedAt, allow change (invitation not yet delivered)
            return true;
        }

        const now = nowInCDMX();
        const deadline = addDaysInCDMX(receivedAt, 20);

        return now <= deadline;
    }

    /**
     * Get RSVP revocation status for a guest
     */
    async getRsvpRevocationStatus(guestId: string) {
        const guest = await this.prisma.guest.findUnique({
            where: { id: guestId },
            include: {
                invitations: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!guest) {
            throw new NotFoundException(`Guest with ID ${guestId} not found`);
        }

        const receivedAt = guest.invitations[0]?.receivedAt;
        const canRevoke = this.canRevokeRsvp(receivedAt);
        const daysRemaining = receivedAt
            ? Math.max(0, 20 - Math.floor((nowInCDMX().getTime() - receivedAt.getTime()) / (1000 * 60 * 60 * 24)))
            : 20;

        return {
            guestId,
            currentStatus: guest.rsvpStatus,
            canRevoke,
            receivedAt,
            daysRemaining,
            respondedAt: guest.respondedAt,
        };
    }
}
