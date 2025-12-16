import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EventStatus } from '@prisma/client';
import { addHoursInCDMX, nowInCDMX } from '../../common/utils/timezone.util';

/**
 * Auto-close job for events
 * Runs every hour and closes events that are 72 hours past their date
 */
@Injectable()
export class AutoCloseJob {
    private readonly logger = new Logger(AutoCloseJob.name);

    constructor(private prisma: PrismaService) { }

    @Cron(CronExpression.EVERY_HOUR)
    async handleAutoClose() {
        this.logger.log('Running auto-close job for events...');

        try {
            const now = nowInCDMX();

            // Find events that are PUBLISHED and 72 hours past their date
            const eventsToClose = await this.prisma.event.findMany({
                where: {
                    status: EventStatus.PUBLISHED,
                    active: true,
                },
            });

            let closedCount = 0;

            for (const event of eventsToClose) {
                // Calculate 72 hours after event date
                const closeTime = addHoursInCDMX(event.date, 72);

                if (now >= closeTime) {
                    await this.prisma.event.update({
                        where: { id: event.id },
                        data: {
                            status: EventStatus.CLOSED,
                            closedAt: now,
                        },
                    });

                    this.logger.log(`Auto-closed event: ${event.name} (ID: ${event.id})`);
                    closedCount++;
                }
            }

            this.logger.log(`Auto-close job completed. Closed ${closedCount} events.`);
        } catch (error) {
            this.logger.error('Error in auto-close job:', error);
        }
    }
}
