import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, ScanStatus } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getEventMetrics(eventId: string, user: any) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { guests: true, invitations: true },
    });

    if (!event) throw new NotFoundException('Event not found');
    this.ensureEventAccess(event, user);

    const guests = event.guests;
    const totalGuests = guests.length;

    // 1. Delivery Success Rate
    // Logic: Invitations with status DELIVERED or SENT / Total Invitations
    const invitations = event.invitations;
    const delivered = invitations.filter((i) =>
      ['DELIVERED', 'SENT'].includes(i.status as string),
    ); // Cast for legacy statuses
    const deliveryRate =
      invitations.length > 0
        ? (delivered.length / invitations.length) * 100
        : 0;

    // 2. RSVP Rate
    // Logic: Guests responded (CONFIRMED or DECLINED) / Guests who received invite (inviteReceivedAt != null)
    const guestsReceived = guests.filter(
      (g) => (g as any).inviteReceivedAt !== null,
    );
    const guestsResponded = guests.filter((g) =>
      ['CONFIRMED', 'DECLINED'].includes(g.rsvpStatus),
    );
    // Fallback: if no inviteReceivedAt date, assume all guests were intended to receive?
    // SRS says "Of delivered". If no one received, rate is technically undefined or 0.
    // We Use guestsReceived.length as denominator.
    const rsvpRate =
      guestsReceived.length > 0
        ? (guestsResponded.length / guestsReceived.length) * 100
        : 0;

    // 3. Show-up Rate
    // Logic: Valid Scans / Confirmed Guests
    // We need to count unique guests who entered.
    // Scan table has 'enteredNames'.
    const scans = await this.prisma.scan.findMany({
      where: {
        eventId,
        status: { in: [ScanStatus.VALID_FULL, ScanStatus.VALID_PARTIAL] },
      },
    });

    let totalEntered = 0;
    scans.forEach((s) => {
      // enteredNames is a string[]
      totalEntered += (s as any).enteredNames.length;
    });

    const confirmedGuests = guests.filter((g) => g.rsvpStatus === 'CONFIRMED');
    // Sum of guestCount for confirmed guests
    const expectedTotal = confirmedGuests.reduce(
      (sum, g) => sum + g.guestCount,
      0,
    );

    const showUpRate =
      expectedTotal > 0 ? (totalEntered / expectedTotal) * 100 : 0;

    // 4. Time to RSVP (Avg days)
    let totalDays = 0;
    let countTime = 0;

    guests.forEach((g) => {
      const guest = g as any;
      if (guest.inviteReceivedAt && (guest.confirmedAt || guest.declinedAt)) {
        const responseDate = guest.confirmedAt || guest.declinedAt;
        const receivedDate = guest.inviteReceivedAt;
        // Difference in milliseconds
        const diffTime = Math.abs(
          responseDate!.getTime() - receivedDate.getTime(),
        );
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        countTime++;
      }
    });

    const avgTimeToRsvp = countTime > 0 ? totalDays / countTime : 0;

    return {
      eventId,
      deliveryRate: parseFloat(deliveryRate.toFixed(2)),
      rsvpRate: parseFloat(rsvpRate.toFixed(2)),
      showUpRate: parseFloat(showUpRate.toFixed(2)),
      avgTimeToRsvp: parseFloat(avgTimeToRsvp.toFixed(2)),
      totalEntered,
      expectedTotal,
    };
  }

  async getGlobalMetrics(user: any) {
    if (!user || user.role !== UserRole.DIRECTOR_GLOBAL) {
      throw new ForbiddenException(
        'Only Director Global can view global metrics',
      );
    }

    const events = await this.prisma.event.findMany({
      include: {
        guests: true,
        invitations: true,
      },
    });

    const scans = await this.prisma.scan.findMany({
      where: {
        status: { in: [ScanStatus.VALID_FULL, ScanStatus.VALID_PARTIAL] },
      },
    });

    if (!events.length) {
      return {
        totalEvents: 0,
        deliveryRate: 0,
        rsvpRate: 0,
        showUpRate: 0,
        avgTimeToRsvp: 0,
        totalInvitations: 0,
        totalGuests: 0,
      };
    }

    const totalInvitations = events.reduce(
      (sum, e) => sum + e.invitations.length,
      0,
    );
    const deliveredInvitations = events.reduce(
      (sum, e) =>
        sum +
        e.invitations.filter((i) =>
          ['DELIVERED', 'SENT'].includes(i.status as string),
        ).length,
      0,
    );

    const totalGuests = events.reduce((sum, e) => sum + e.guests.length, 0);
    const guestsReceived = events.flatMap((e) =>
      e.guests.filter((g) => (g as any).inviteReceivedAt),
    );
    const guestsResponded = events.flatMap((e) =>
      e.guests.filter((g) => ['CONFIRMED', 'DECLINED'].includes(g.rsvpStatus)),
    );

    const confirmedGuests = events.flatMap((e) =>
      e.guests.filter((g) => g.rsvpStatus === 'CONFIRMED'),
    );
    const expectedTotal = confirmedGuests.reduce(
      (sum, g) => sum + g.guestCount,
      0,
    );
    const totalEntered = scans.reduce(
      (sum, scan: any) => sum + scan.enteredNames.length,
      0,
    );

    let totalDays = 0;
    let countTime = 0;
    events.forEach((e) => {
      e.guests.forEach((guest) => {
        const g: any = guest;
        if (g.inviteReceivedAt && (g.confirmedAt || g.declinedAt)) {
          const responseDate = g.confirmedAt || g.declinedAt;
          const diffTime = Math.abs(
            responseDate!.getTime() - g.inviteReceivedAt.getTime(),
          );
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          totalDays += diffDays;
          countTime++;
        }
      });
    });

    const deliveryRate =
      totalInvitations > 0
        ? (deliveredInvitations / totalInvitations) * 100
        : 0;
    const rsvpRate =
      guestsReceived.length > 0
        ? (guestsResponded.length / guestsReceived.length) * 100
        : 0;
    const showUpRate =
      expectedTotal > 0 ? (totalEntered / expectedTotal) * 100 : 0;
    const avgTimeToRsvp = countTime > 0 ? totalDays / countTime : 0;

    return {
      totalEvents: events.length,
      totalInvitations,
      totalGuests,
      deliveryRate: parseFloat(deliveryRate.toFixed(2)),
      rsvpRate: parseFloat(rsvpRate.toFixed(2)),
      showUpRate: parseFloat(showUpRate.toFixed(2)),
      avgTimeToRsvp: parseFloat(avgTimeToRsvp.toFixed(2)),
    };
  }

  private ensureEventAccess(event: any, user: any) {
    if (!user) {
      throw new ForbiddenException('User context required');
    }

    if (user.role === UserRole.DIRECTOR_GLOBAL) {
      return;
    }

    if (user.role === UserRole.PLANNER && event.plannerId === user.id) {
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to view these metrics',
    );
  }
}
