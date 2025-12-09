import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RsvpConfigDto } from './dto/rsvp-config.dto';

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
}
