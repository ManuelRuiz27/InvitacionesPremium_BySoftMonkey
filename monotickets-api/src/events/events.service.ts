import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import {
  Event,
  EventStatus,
  InviteMode,
  Prisma,
  UserRole,
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user.interface';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  private readonly plannerSelect = {
    id: true,
    email: true,
    fullName: true,
  };

  async create(createEventDto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        name: createEventDto.name,
        category: createEventDto.category,
        eventAt: new Date(createEventDto.eventAt),
        venueText: createEventDto.venueText ?? createEventDto.location,
        location: createEventDto.location,
        description: createEventDto.description,
        inviteMode: createEventDto.inviteMode ?? InviteMode.PDF,
        guestCountDefault: createEventDto.guestCountDefault ?? 1,
        allowPartialEntry: createEventDto.allowPartialEntry ?? true,
        plannerId: createEventDto.plannerId,
      },
      include: {
        planner: { select: this.plannerSelect },
      },
    });

    return event;
  }

  async findAll(plannerId?: string) {
    const where = plannerId ? { plannerId, active: true } : { active: true };

    const events = await this.prisma.event.findMany({
      where,
      include: {
        planner: { select: this.plannerSelect },
        _count: {
          select: {
            guests: true,
            invitations: true,
            scans: true,
          },
        },
      },
      orderBy: {
        eventAt: 'desc',
      },
    });

    return events;
  }

  async findOne(id: string, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        planner: { select: this.plannerSelect },
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

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    user: AuthenticatedUser,
  ) {
    const event = await this.getEventOrThrow(id);

    // Security Check: Ensure planner owns the event
    if (user.role === 'PLANNER' && event.plannerId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to update this event',
      );
    }

    // Convert date string to Date object if provided
    const updateData: Prisma.EventUpdateInput = {
      ...updateEventDto,
    };
    if (updateEventDto.eventAt) {
      updateData.eventAt = new Date(updateEventDto.eventAt);
    }

    if (
      updateEventDto.venueText === undefined &&
      updateEventDto.location !== undefined
    ) {
      updateData.venueText = updateEventDto.location;
    }

    return this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        planner: { select: this.plannerSelect },
      },
    });
  }

  async remove(id: string, user?: AuthenticatedUser) {
    // Verify event exists and user has access
    await this.findOne(id, user ? user.id : undefined);

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

  async publish(eventId: string, user: AuthenticatedUser) {
    const event = await this.getEventOrThrow(eventId);
    this.assertPlannerOrDirector(event, user);

    if (event.status === EventStatus.CLOSED) {
      throw new BadRequestException('Closed events cannot be published');
    }

    if (event.status === EventStatus.BLOCKED) {
      throw new BadRequestException(
        'Blocked events must be unblocked before publishing',
      );
    }

    if (event.status === EventStatus.PUBLISHED) {
      return this.findOne(eventId, this.getUserIdForOwnershipCheck(user));
    }

    await this.prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.PUBLISHED,
        publishedAt: event.publishedAt ?? new Date(),
      },
    });

    return this.findOne(eventId, this.getUserIdForOwnershipCheck(user));
  }

  async close(eventId: string, user: AuthenticatedUser) {
    const event = await this.getEventOrThrow(eventId);
    this.assertPlannerOrDirector(event, user);

    if (event.status === EventStatus.DRAFT) {
      throw new BadRequestException(
        'Draft events must be published before closing',
      );
    }

    if (event.status === EventStatus.BLOCKED) {
      throw new BadRequestException('Blocked events cannot be closed');
    }

    if (event.status === EventStatus.CLOSED) {
      return this.findOne(eventId, this.getUserIdForOwnershipCheck(user));
    }

    await this.prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.CLOSED,
        closedAt: new Date(),
      },
    });

    return this.findOne(eventId, this.getUserIdForOwnershipCheck(user));
  }

  async block(eventId: string, user: AuthenticatedUser) {
    this.assertDirector(user);
    const event = await this.getEventOrThrow(eventId);

    if (event.status === EventStatus.BLOCKED) {
      throw new BadRequestException('Event is already blocked');
    }

    await this.prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.BLOCKED,
        blockedAt: new Date(),
        blockedBy: user.id,
      },
    });

    return this.findOne(eventId);
  }

  async unblock(eventId: string, user: AuthenticatedUser) {
    this.assertDirector(user);
    const event = await this.getEventOrThrow(eventId);

    if (event.status !== EventStatus.BLOCKED) {
      throw new BadRequestException('Event is not blocked');
    }

    const nextStatus = event.closedAt
      ? EventStatus.CLOSED
      : event.publishedAt
        ? EventStatus.PUBLISHED
        : EventStatus.DRAFT;

    await this.prisma.event.update({
      where: { id: eventId },
      data: {
        status: nextStatus,
        blockedAt: null,
        blockedBy: null,
      },
    });

    return this.findOne(eventId);
  }

  private async getEventOrThrow(eventId: string): Promise<Event> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    return event;
  }

  private assertPlannerOrDirector(event: Event, user: AuthenticatedUser) {
    if (!user) {
      throw new ForbiddenException('User context required');
    }

    if (user.role === UserRole.DIRECTOR_GLOBAL) {
      return;
    }

    if (user.role !== UserRole.PLANNER || event.plannerId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to manage this event',
      );
    }
  }

  private getUserIdForOwnershipCheck(user?: AuthenticatedUser) {
    if (user?.role === UserRole.PLANNER) {
      return user.id;
    }
    return undefined;
  }

  private assertDirector(user: AuthenticatedUser) {
    if (!user || user.role !== UserRole.DIRECTOR_GLOBAL) {
      throw new ForbiddenException(
        'Only Director Global can perform this action',
      );
    }
  }
}
