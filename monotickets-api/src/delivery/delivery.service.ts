import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SendDeliveryDto } from './dto/send-delivery.dto';
import { DeliveryMethod, DeliveryStatus } from '@prisma/client';
import { Twilio } from 'twilio';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);
  private twilioClient: Twilio;

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      this.twilioClient = new Twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials not found. SMS delivery will fail.');
    }
  }

  async sendBulk(dto: SendDeliveryDto) {
    const results: {
      total: number;
      successful: number;
      failed: number;
      errors: { id: string; error: string }[];
    } = {
      total: dto.invitationIds.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const id of dto.invitationIds) {
      try {
        await this.sendInvitation(id);
        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ id, error: error.message });
      }
    }

    return results;
  }

  async sendInvitation(invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { guest: true, event: true },
    });

    if (!invitation) {
      throw new BadRequestException('Invitation not found');
    }

    if (!invitation.guest.phone) {
      throw new BadRequestException('Guest has no phone number');
    }

    // Try SMS first (Primary Channel)
    try {
      await this.sendViaSMS(invitation);
    } catch (smsError) {
      this.logger.error(`SMS failed for ${invitationId}: ${smsError.message}`);
    }

    // Try WhatsApp (Secondary Channel)
    try {
      await this.sendViaWhatsApp(invitation);
    } catch (waError) {
      this.logger.error(
        `WhatsApp failed for ${invitationId}: ${waError.message}`,
      );
    }

    // Update Invite Received At if not set
    if (!invitation.guest.inviteReceivedAt) {
      await this.prisma.guest.update({
        where: { id: invitation.guestId },
        data: { inviteReceivedAt: new Date() },
      });
    }

    return { message: 'Delivery attempts initiated' };
  }

  async sendViaSMS(invitation: any, attemptCount = 1) {
    if (!this.twilioClient) {
      await this.logAttempt(
        invitation.id,
        DeliveryMethod.SMS,
        DeliveryStatus.FAILED,
        'Twilio not configured',
      );
      throw new Error('Twilio not configured');
    }

    try {
      // Generate Valid Link (Mock for now, should point to frontend)
      const link = `https://monotickets.com/i/${invitation.id}`;

      await this.twilioClient.messages.create({
        body: `Hola ${invitation.guest.fullName}, tienes una invitación para ${invitation.event.name}. Ver aquí: ${link}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: invitation.guest.phone,
      });

      await this.logAttempt(
        invitation.id,
        DeliveryMethod.SMS,
        DeliveryStatus.DELIVERED,
      );

      // Update status if it was SENT
      if (invitation.status === 'CREATED' || invitation.status === 'SENT') {
        await this.prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'DELIVERED', deliveredAt: new Date() },
        });
      }
    } catch (error: any) {
      await this.logAttempt(
        invitation.id,
        DeliveryMethod.SMS,
        DeliveryStatus.FAILED,
        error.message,
      );

      // Retry logic (Exponential backoff)
      if (attemptCount < 3) {
        // In a real job queue, we would schedule this.
        // For now, we just log requirement.
        this.logger.warn(
          `Should retry SMS for ${invitation.id} (Attempt ${attemptCount})`,
        );
      }
      throw error;
    }
  }

  async sendViaWhatsApp(invitation: any, attemptCount = 1) {
    const metaToken = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_PHONE_ID;

    if (!metaToken || !phoneId) {
      await this.logAttempt(
        invitation.id,
        DeliveryMethod.WHATSAPP,
        DeliveryStatus.FAILED,
        'Meta API not configured',
      );
      throw new Error('Meta API not configured');
    }

    try {
      const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        to: invitation.guest.phone.replace('+', ''), // Meta format often requires no plus
        type: 'template',
        template: {
          name: 'invitacion_evento_v1', // Template name must actally exist in Meta
          language: { code: 'es_MX' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: invitation.guest.fullName },
                { type: 'text', text: invitation.event.name },
              ],
            },
          ],
        },
      };

      await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: { Authorization: `Bearer ${metaToken}` },
        }),
      );

      await this.logAttempt(
        invitation.id,
        DeliveryMethod.WHATSAPP,
        DeliveryStatus.DELIVERED,
      );
    } catch (error: any) {
      await this.logAttempt(
        invitation.id,
        DeliveryMethod.WHATSAPP,
        DeliveryStatus.FAILED,
        error.message,
      );
      if (attemptCount < 3) {
        this.logger.warn(
          `Should retry WhatsApp for ${invitation.id} (Attempt ${attemptCount})`,
        );
      }
      throw error;
    }
  }

  private async logAttempt(
    invitationId: string,
    method: DeliveryMethod,
    status: DeliveryStatus,
    errorMessage?: string,
  ) {
    await this.prisma.deliveryAttempt.create({
      data: {
        invitationId,
        method,
        status,
        errorMessage,
        sentAt: new Date(),
      },
    });
  }

  async getDeliveryStats(eventId: string) {
    const attempts = await this.prisma.deliveryAttempt.findMany({
      where: {
        invitation: { eventId },
      },
    });

    const total = attempts.length;
    const delivered = attempts.filter(
      (a) => a.status === DeliveryStatus.DELIVERED,
    ).length;
    const failed = attempts.filter(
      (a) => a.status === DeliveryStatus.FAILED,
    ).length;

    return {
      totalAttempts: total,
      delivered,
      failed,
      successRate: total > 0 ? (delivered / total) * 100 : 0,
    };
  }
}
