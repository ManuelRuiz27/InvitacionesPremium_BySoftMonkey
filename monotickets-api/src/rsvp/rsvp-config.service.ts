import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRsvpConfigDto } from './dto/create-rsvp-config.dto';
import { UpdateRsvpConfigDto } from './dto/update-rsvp-config.dto';

@Injectable()
export class RsvpConfigService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateConfig(eventId: string) {
    let config = await this.prisma.rsvpConfig.findUnique({
      where: { eventId },
    });

    if (!config) {
      config = await this.prisma.rsvpConfig.create({
        data: {
          eventId,
          allowRsvp: true,
          rsvpDeadlineDays: 0, // 0 = Day of event
          revocationWindowDays: 20,
        },
      });
    }

    return config;
  }

  async updateConfig(eventId: string, dto: UpdateRsvpConfigDto) {
    const config = await this.getOrCreateConfig(eventId);

    return this.prisma.rsvpConfig.update({
      where: { id: config.id },
      data: dto,
    });
  }

  async canRevoke(
    eventId: string,
    guestId: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const config = await this.getOrCreateConfig(eventId);
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!guest) throw new NotFoundException('Guest not found');
    if (!(guest as any).inviteReceivedAt) {
      // If never received, technically can't revoke what you didn't get,
      // but logically it means no constraint applies yet.
      return { allowed: true };
    }

    const now = new Date();
    const receivedDate = new Date((guest as any).inviteReceivedAt);
    const deadlineDate = new Date(receivedDate);
    deadlineDate.setDate(deadlineDate.getDate() + config.revocationWindowDays);

    if (now > deadlineDate) {
      return {
        allowed: false,
        reason: `Revocation window expired. Window is ${config.revocationWindowDays} days from receipt.`,
      };
    }

    return { allowed: true };
  }
}
