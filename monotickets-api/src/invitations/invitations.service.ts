import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateInvitationsDto } from './dto/generate-invitations.dto';
import { SendInvitationsDto } from './dto/send-invitations.dto';
import * as jwt from 'jsonwebtoken';
import { DeliveryService } from '../delivery/delivery.service';
import { InvitationStatus } from '@prisma/client';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private deliveryService: DeliveryService,
  ) {}

<<<<<<< HEAD
  async generate(eventId: string, generateDto: GenerateInvitationsDto) {
    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
=======
    async generate(eventId: string, generateDto: GenerateInvitationsDto) {
        // Verify event exists and get invitation count
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                _count: {
                    select: { invitations: true },
                },
            },
        });

        if (!event) {
            throw new NotFoundException(`Event with ID ${eventId} not found`);
        }

        // Verify all guests exist and belong to this event
        const guests = await this.prisma.guest.findMany({
            where: {
                id: { in: generateDto.guestIds },
                eventId,
            },
        });

        if (guests.length !== generateDto.guestIds.length) {
            throw new BadRequestException('Some guests not found or do not belong to this event');
        }

        // Check for existing invitations
        const existingInvitations = await this.prisma.invitation.findMany({
            where: {
                guestId: { in: generateDto.guestIds },
                eventId,
            },
        });

        if (existingInvitations.length > 0) {
            throw new BadRequestException(
                `Some guests already have invitations: ${existingInvitations.map(i => i.guestId).join(', ')}`,
            );
        }

        // Check max 1000 invitations per event
        const currentInvitationCount = event._count.invitations;
        const potentialTotal = currentInvitationCount + guests.length;

        if (potentialTotal > event.maxInvitations) {
            throw new BadRequestException(
                `Cannot generate ${guests.length} invitations. Would exceed maximum of ${event.maxInvitations} invitations per event. Current: ${currentInvitationCount}`,
            );
        }

        // Generate invitations with QR tokens and initialize remainingCount
        const invitations = await this.prisma.$transaction(
            guests.map((guest) => {
                const qrToken = this.generateQRToken(eventId, guest.id);

                return this.prisma.invitation.create({
                    data: {
                        qrToken,
                        guestId: guest.id,
                        eventId,
                        status: 'PENDING',
                        remainingCount: guest.guestCount, // Initialize with guestCount
                    },
                    include: {
                        guest: true,
                    },
                });
            }),
        );

        return {
            message: `Successfully generated ${invitations.length} invitations`,
            count: invitations.length,
            invitations,
        };
>>>>>>> ff183bdbed4957932f8d0fec1d925d02cf1e8910
    }

    // Verify all guests exist and belong to this event
    const guests = await this.prisma.guest.findMany({
      where: {
        id: { in: generateDto.guestIds },
        eventId,
      },
    });

    if (guests.length !== generateDto.guestIds.length) {
      throw new BadRequestException(
        'Some guests not found or do not belong to this event',
      );
    }

    // Check for existing invitations
    const existingInvitations = await this.prisma.invitation.findMany({
      where: {
        guestId: { in: generateDto.guestIds },
        eventId,
      },
    });

    if (existingInvitations.length > 0) {
      throw new BadRequestException(
        `Some guests already have invitations: ${existingInvitations.map((i) => i.guestId).join(', ')}`,
      );
    }

    // Generate invitations (JWT QR will be generated dynamically)
    const invitations = await this.prisma.$transaction(
      guests.map((guest) => {
        return this.prisma.invitation.create({
          data: {
            qrToken: null, // JWT generated dynamically
            guestId: guest.id,
            eventId,
            status: 'CREATED',
            remainingCount: guest.guestCount,
          },
          include: {
            guest: true,
          },
        });
      }),
    );

    return {
      message: `Successfully generated ${invitations.length} invitations`,
      count: invitations.length,
      invitations,
    };
  }

  async findAll(eventId: string) {
    const invitations = await this.prisma.invitation.findMany({
      where: { eventId },
      include: {
        guest: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations;
  }

  async findOne(id: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
      include: {
        guest: true,
        event: {
          select: {
            id: true,
            name: true,
            eventAt: true,
            location: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException(`Invitation with ID ${id} not found`);
    }

    return invitation;
  }

  async findByQRToken(qrToken: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { qrToken },
      include: {
        guest: true,
        event: {
          select: {
            id: true,
            name: true,
            eventAt: true,
            location: true,
            description: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException(
        `Invitation with QR token ${qrToken} not found`,
      );
    }

    return invitation;
  }

  async send(sendDto: SendInvitationsDto) {
    const invitations = await this.prisma.invitation.findMany({
      where: {
        id: { in: sendDto.invitationIds },
      },
      include: {
        guest: true,
        event: true,
      },
    });

    if (invitations.length !== sendDto.invitationIds.length) {
      throw new BadRequestException('Some invitations not found');
    }

    const now = new Date();
    const updatedInvitations = await this.prisma.$transaction(
      invitations.map((invitation) =>
        this.prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            status: InvitationStatus.AWAITING_RSVP,
            sentAt: now,
            deliveredAt: null,
          },
          include: {
            guest: true,
            event: true,
          },
        }),
      ),
    );

    const deliveryResults = await this.deliveryService.sendBulk({
      invitationIds: sendDto.invitationIds,
    });

    return {
      message: 'Delivery attempts processed',
      invitations: updatedInvitations.map((invitation) => ({
        id: invitation.id,
        status: invitation.status,
        sentAt: invitation.sentAt,
        guestName: invitation.guest.fullName,
        eventId: invitation.eventId,
      })),
      delivery: deliveryResults,
    };
  }

  async getInvitationStats(eventId: string) {
    const totalInvitations = await this.prisma.invitation.count({
      where: { eventId },
    });

    const awaitingRsvp = await this.prisma.invitation.count({
      where: {
        eventId,
        status: InvitationStatus.AWAITING_RSVP,
      },
    });

    const deliveredInvitations = await this.prisma.invitation.count({
      where: {
        eventId,
        status: InvitationStatus.DELIVERED,
      },
    });

    const pendingInvitations = await this.prisma.invitation.count({
      where: {
        eventId,
        status: InvitationStatus.CREATED,
      },
    });

    const failedInvitations = await this.prisma.invitation.count({
      where: {
        eventId,
        status: InvitationStatus.FAILED,
      },
    });

    return {
      totalInvitations,
      awaitingRsvp,
      deliveredInvitations,
      pendingInvitations,
      failedInvitations,
    };
  }

  // Generate JWT-based QR token
  generateJWT(
    invitationId: string,
    eventId: string,
    guestId: string,
    eventDate: Date,
  ): string {
    const jwtSecret =
      process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    // Calculate validity window (event day in CDMX timezone)
    const eventDateCDMX = new Date(eventDate);
    const startOfDay = new Date(eventDateCDMX.setHours(0, 0, 0, 0));
    const endOfDay = new Date(eventDateCDMX.setHours(23, 59, 59, 999));

    const payload = {
      iss: 'monotickets-platinum',
      sub: invitationId,
      eventId,
      guestId,
      iat: Math.floor(Date.now() / 1000),
      nbf: Math.floor(startOfDay.getTime() / 1000),
      exp: Math.floor(endOfDay.getTime() / 1000),
    };

    return jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });
  }

  // New endpoint to get QR JWT for an invitation
  async getQRToken(invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        guest: true,
        event: {
          select: {
            id: true,
            eventAt: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException(
        `Invitation with ID ${invitationId} not found`,
      );
    }

    const qrToken = this.generateJWT(
      invitation.id,
      invitation.event.id,
      invitation.guest.id,
      invitation.event.eventAt,
    );

    return {
      invitationId: invitation.id,
      qrToken,
      guestName: invitation.guest.fullName,
      guestCount: invitation.guest.guestCount,
    };
  }
}
