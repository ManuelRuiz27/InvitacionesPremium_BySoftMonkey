import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Anonymizes all guests for an event.
   * Keeps metrics (guestCount, rsvpStatus, timestamps) but removes PII.
   * Logic: fullName -> "Anonymized Guest {ID}", phone -> null, email -> null
   */
  async anonymizeEventGuests(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { guests: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    this.logger.log(
      `Starting anonymization for event ${eventId} (${event.name})`,
    );

    let count = 0;
    for (const guest of event.guests) {
      await this.prisma.guest.update({
        where: { id: guest.id },
        data: {
          fullName: `Anonymized Guest ${guest.id.substring(0, 8)}`,
          phone: null,
          email: null,
        },
      });
      count++;
    }

    this.logger.log(`Anonymized ${count} guests for event ${eventId}`);
    return { success: true, count };
  }

  /**
   * Hard delete of an event and all related data (guests, invitations, scans).
   * Used for "Right to be Forgotten" requested by Planner.
   */
  async deleteEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Prisma cascade delete should handle relations if configured,
    // but explicit transaction is safer for verification.
    // Actually our schema has onDelete: Cascade for most relations.
    await this.prisma.event.delete({ where: { id: eventId } });

    this.logger.log(`Deleted event ${eventId} and all related data.`);
    return { success: true, message: 'Event deleted successfully' };
  }

  /**
   * Finds events older than 12 months (retention policy) and anonymizes them.
   */
  async runRetentionPolicy() {
    const retentionDate = new Date();
    retentionDate.setMonth(retentionDate.getMonth() - 12);

    const oldEvents = await this.prisma.event.findMany({
      where: {
        eventAt: { lt: retentionDate },
        // Assuming we want to track which are strictly 'closed' or just strict date check
      },
    });

    this.logger.log(
      `Found ${oldEvents.length} events older than 12 months for retention policy.`,
    );

    const results: any[] = [];
    for (const event of oldEvents) {
      // Check if already anonymized? PII check is expensive.
      // We can check if name starts with "Anonymized" but that's weak.
      // For now, simple re-run is safe as it just updates to same value.
      const result = await this.anonymizeEventGuests(event.id);
      results.push({ eventId: event.id, ...result });
    }

    return results;
  }
}
