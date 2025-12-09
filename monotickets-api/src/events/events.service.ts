import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    async create(createEventDto: CreateEventDto) {
        const event = await this.prisma.event.create({
            data: {
                name: createEventDto.name,
                date: new Date(createEventDto.date),
                location: createEventDto.location,
                description: createEventDto.description,
                plannerId: createEventDto.plannerId,
            },
            include: {
                planner: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
        });

        return event;
    }

    async findAll(plannerId?: string) {
        const where = plannerId ? { plannerId, active: true } : { active: true };

        const events = await this.prisma.event.findMany({
            where,
            include: {
                planner: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
                _count: {
                    select: {
                        guests: true,
                        invitations: true,
                        scans: true,
                    },
                },
            },
            orderBy: {
                date: 'desc',
            },
        });

        return events;
    }

    async findOne(id: string, userId?: string) {
        const event = await this.prisma.event.findUnique({
            where: { id },
            include: {
                planner: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
                _count: {
                    select: {
                        guests: true,
                        invitations: true,
                        scans: true,
                    },
                },
            },
        });

        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        // Verify access if userId provided
        if (userId && event.plannerId !== userId) {
            throw new ForbiddenException('You do not have access to this event');
        }

        return event;
    }

    async update(id: string, updateEventDto: UpdateEventDto, userId?: string) {
        // Verify event exists and user has access
        await this.findOne(id, userId);

        const updateData: any = {
            ...updateEventDto,
        };

        if (updateEventDto.date) {
            updateData.date = new Date(updateEventDto.date);
        }

        const event = await this.prisma.event.update({
            where: { id },
            data: updateData,
            include: {
                planner: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
        });

        return event;
    }

    async remove(id: string, userId?: string) {
        // Verify event exists and user has access
        await this.findOne(id, userId);

        // Soft delete
        const event = await this.prisma.event.update({
            where: { id },
            data: { active: false },
        });

        return { message: 'Event deleted successfully', event };
    }

    async getEventStats(eventId: string) {
        const stats = await this.prisma.event.findUnique({
            where: { id: eventId },
            select: {
                _count: {
                    select: {
                        guests: true,
                        invitations: true,
                        scans: true,
                    },
                },
            },
        });

        if (!stats) {
            throw new NotFoundException(`Event with ID ${eventId} not found`);
        }

        const confirmedGuests = await this.prisma.guest.count({
            where: {
                eventId,
                rsvpStatus: 'CONFIRMED',
            },
        });

        return {
            totalGuests: stats._count.guests,
            totalInvitations: stats._count.invitations,
            totalScans: stats._count.scans,
            confirmedGuests,
        };
    }
}
