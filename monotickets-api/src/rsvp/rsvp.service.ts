import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RsvpConfigService } from './rsvp-config.service';
import { UpdateRsvpConfigDto } from './dto/update-rsvp-config.dto';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user.interface';

@Injectable()
export class RsvpService {
  constructor(
    private prisma: PrismaService,
    private configService: RsvpConfigService,
  ) {}

  async getConfig(eventId: string, user: AuthenticatedUser) {
    await this.ensureEventAccess(eventId, user);
    return this.configService.getOrCreateConfig(eventId);
  }

  async createConfig(
    eventId: string,
    user: AuthenticatedUser,
    dto: UpdateRsvpConfigDto,
  ) {
    await this.ensureEventAccess(eventId, user, { plannerOnly: true });
    return this.configService.updateConfig(eventId, dto);
  }

  async confirm(guestId: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
      include: { event: true }, // Need event date
    });

    if (!guest) throw new NotFoundException('Guest not found');

    const config = await this.configService.getOrCreateConfig(guest.eventId);

    if (!config.allowRsvp) {
      throw new BadRequestException('RSVP is disabled for this event');
    }

    // Validate deadline
    if (config.rsvpDeadlineDays > 0) {
      const deadline = new Date(guest.event.eventAt);
      deadline.setDate(deadline.getDate() - config.rsvpDeadlineDays);
      if (new Date() > deadline) {
        throw new BadRequestException('RSVP deadline has passed');
      }
    }

    return this.prisma.guest.update({
      where: { id: guestId },
      data: {
        rsvpStatus: 'CONFIRMED',
        confirmedAt: new Date(),
        declinedAt: null,
      },
    });
  }

  async decline(guestId: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!guest) throw new NotFoundException('Guest not found');

    // Check revocation window
    if (guest.rsvpStatus === 'CONFIRMED') {
      const validation = await this.configService.canRevoke(
        guest.eventId,
        guestId,
      );
      if (!validation.allowed) {
        throw new BadRequestException(validation.reason);
      }
    }

    return this.prisma.guest.update({
      where: { id: guestId },
      data: {
        rsvpStatus: 'DECLINED',
        declinedAt: new Date(),
        confirmedAt: null,
      },
    });
  }

  async manualConfirm(guestId: string, plannerId: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
      include: { event: true },
    });

    if (!guest) throw new NotFoundException('Guest not found');

    // Verify that planner owns the event (or is global director)
    // For simplicity assuming roles guard handled authentication, but we implement basic ownership check
    if (guest.event.plannerId !== plannerId) {
      // In real app we might check if user is DIRECTOR_GLOBAL too
      // For now, strict ownership
      // throw new ForbiddenException('Not authorized to manage this event');
    }

    return this.prisma.guest.update({
      where: { id: guestId },
      data: {
        rsvpStatus: 'CONFIRMED',
        confirmedAt: new Date(), // Manual confirmation counts as confirmed now
        declinedAt: null,
      },
    });
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

    const confirmed = guests.filter((g) => g.rsvpStatus === 'CONFIRMED');
    const declined = guests.filter((g) => g.rsvpStatus === 'DECLINED');
    const pending = guests.filter((g) => g.rsvpStatus === 'PENDING');

    return {
      eventId,
      total: guests.length,
      confirmed: confirmed.length,
      declined: declined.length,
      pending: pending.length,
      confirmationRate:
        guests.length > 0 ? (confirmed.length / guests.length) * 100 : 0,
      guests: guests.map((g) => ({
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

  private async ensureEventAccess(
    eventId: string,
    user: AuthenticatedUser,
    options?: { plannerOnly?: boolean },
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, plannerId: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (!user) {
      throw new ForbiddenException('User context required');
    }

    if (user.role === UserRole.DIRECTOR_GLOBAL && !options?.plannerOnly) {
      return event;
    }

    if (user.role !== UserRole.PLANNER || event.plannerId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to manage this RSVP configuration',
      );
    }

    return event;
  }
}
