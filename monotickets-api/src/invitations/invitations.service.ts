import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateInvitationsDto } from './dto/generate-invitations.dto';
import { SendInvitationsDto } from './dto/send-invitations.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvitationsService {
    constructor(private prisma: PrismaService) { }

    async generate(eventId: string, generateDto: GenerateInvitationsDto) {
        // Verify event exists
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
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

        // Generate invitations with QR tokens
        const invitations = await this.prisma.$transaction(
            guests.map((guest) => {
                const qrToken = this.generateQRToken(eventId, guest.id);

                return this.prisma.invitation.create({
                    data: {
                        qrToken,
                        guestId: guest.id,
                        eventId,
                        status: 'PENDING',
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
                        date: true,
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
                        date: true,
                        location: true,
                        description: true,
                    },
                },
            },
        });

        if (!invitation) {
            throw new NotFoundException(`Invitation with QR token ${qrToken} not found`);
        }

        return invitation;
    }

    async send(sendDto: SendInvitationsDto) {
        // Verify all invitations exist
        const invitations = await this.prisma.invitation.findMany({
            where: {
                id: { in: sendDto.invitationIds },
            },
            include: {
                guest: true,
            },
        });

        if (invitations.length !== sendDto.invitationIds.length) {
            throw new BadRequestException('Some invitations not found');
        }

        // Update status to SENT
        // In production, this would integrate with SMS/Email/WhatsApp services
        const updatedInvitations = await this.prisma.$transaction(
            invitations.map((invitation) =>
                this.prisma.invitation.update({
                    where: { id: invitation.id },
                    data: {
                        status: 'SENT',
                        sentAt: new Date(),
                    },
                }),
            ),
        );

        return {
            message: `Successfully sent ${updatedInvitations.length} invitations`,
            count: updatedInvitations.length,
            method: sendDto.method || 'SMS',
            invitations: updatedInvitations,
        };
    }

    async getInvitationStats(eventId: string) {
        const totalInvitations = await this.prisma.invitation.count({
            where: { eventId },
        });

        const sentInvitations = await this.prisma.invitation.count({
            where: {
                eventId,
                status: 'SENT',
            },
        });

        const deliveredInvitations = await this.prisma.invitation.count({
            where: {
                eventId,
                status: 'DELIVERED',
            },
        });

        const pendingInvitations = await this.prisma.invitation.count({
            where: {
                eventId,
                status: 'PENDING',
            },
        });

        const failedInvitations = await this.prisma.invitation.count({
            where: {
                eventId,
                status: 'FAILED',
            },
        });

        return {
            totalInvitations,
            sentInvitations,
            deliveredInvitations,
            pendingInvitations,
            failedInvitations,
        };
    }

    // Generate unique QR token
    private generateQRToken(eventId: string, guestId: string): string {
        const uuid = uuidv4();
        const timestamp = Date.now().toString(36);
        const eventPrefix = eventId.substring(0, 8);
        const guestPrefix = guestId.substring(0, 8);

        return `EV-${eventPrefix}-${guestPrefix}-${timestamp}-${uuid.substring(0, 8)}`.toUpperCase();
    }
}
