import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryService } from '../delivery/delivery.service';
import { DeliveryStatus, InvitationStatus } from '@prisma/client';

const MAX_ATTEMPTS = 3;
const COOLDOWN_MINUTES = 5;

@Injectable()
export class DeliveryRetryService {
  private readonly logger = new Logger(DeliveryRetryService.name);

  constructor(
    private prisma: PrismaService,
    private deliveryService: DeliveryService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedDeliveries() {
    const now = new Date();
    const invitations = await this.prisma.invitation.findMany({
      where: {
        status: {
          in: [InvitationStatus.AWAITING_RSVP, InvitationStatus.CREATED],
        },
        deliveryAttempts: {
          some: { status: DeliveryStatus.FAILED },
        },
      },
      include: {
        deliveryAttempts: true,
      },
      take: 25,
    });

    if (!invitations.length) {
      return { retried: 0 };
    }

    let retried = 0;
    for (const invitation of invitations) {
      const attempts = invitation.deliveryAttempts.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
      const hasSuccess = attempts.some(
        (attempt) => attempt.status === DeliveryStatus.DELIVERED,
      );
      if (hasSuccess) continue;

      if (attempts.length >= MAX_ATTEMPTS) continue;

      const lastAttempt = attempts[attempts.length - 1];
      if (lastAttempt) {
        const diffMinutes =
          (now.getTime() - lastAttempt.createdAt.getTime()) / (60 * 1000);
        if (diffMinutes < COOLDOWN_MINUTES) continue;
      }

      try {
        await this.deliveryService.sendInvitation(invitation.id);
        retried++;
      } catch (error: any) {
        this.logger.warn(
          `Retry failed for invitation ${invitation.id}: ${error.message}`,
        );
      }
    }

    if (retried) {
      this.logger.log(`Processed ${retried} invitation delivery retries`);
    }

    return { retried };
  }
}
