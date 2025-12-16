import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventStatus } from '@prisma/client';

@Injectable()
export class EventClosureService {
  private readonly logger = new Logger(EventClosureService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Run every hour.
   * Checks for events that are PUBLISHED and date + 72h < now.
   * Updates them to CLOSED.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleEventClosure() {
    this.logger.log('Running automatic event closure check...');

    const now = new Date();
    const closureThreshold = new Date(now.getTime() - 72 * 60 * 60 * 1000); // Events older than 72h

    const eventsToClose = await this.prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        eventAt: {
          lt: closureThreshold,
        },
      },
    });

    if (eventsToClose.length === 0) {
      this.logger.log('No events found for automatic closure.');
      return { count: 0 };
    }

    this.logger.log(
      `Found ${eventsToClose.length} events to close automatically.`,
    );

    let count = 0;
    for (const event of eventsToClose) {
      await this.prisma.event.update({
        where: { id: event.id },
        data: {
          status: EventStatus.CLOSED,
          closedAt: new Date(),
        },
      });
      this.logger.log(`Closed event: ${event.name} (${event.id})`);
      count++;
    }

    return { count };
  }
}
