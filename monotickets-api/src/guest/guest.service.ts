import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RsvpDto } from './dto/rsvp.dto';

@Injectable()
export class GuestService {
    constructor(private prisma: PrismaService) { }

    async getInvitation(token: string) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { qrToken: token },
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
            throw new NotFoundException(`Invitation with token ${token} not found`);
        }

        return {
            invitation: {
                id: invitation.id,
                qrToken: invitation.qrToken,
                status: invitation.status,
            },
            guest: {
                id: invitation.guest.id,
                fullName: invitation.guest.fullName,
                guestCount: invitation.guest.guestCount,
                rsvpStatus: invitation.guest.rsvpStatus,
            },
            event: invitation.event,
        };
    }

    async confirmRsvp(rsvpDto: RsvpDto) {
        // Find invitation
        const invitation = await this.prisma.invitation.findUnique({
            where: { qrToken: rsvpDto.qrToken },
            include: {
                guest: true,
            },
        });

        if (!invitation) {
            throw new NotFoundException(`Invitation with token ${rsvpDto.qrToken} not found`);
        }

        // Update guest RSVP status
        const updatedGuest = await this.prisma.guest.update({
            where: { id: invitation.guestId },
            data: {
                rsvpStatus: rsvpDto.status,
            },
        });

        return {
            message: 'RSVP confirmed successfully',
            guest: {
                id: updatedGuest.id,
                fullName: updatedGuest.fullName,
                rsvpStatus: updatedGuest.rsvpStatus,
            },
        };
    }

    async getQR(token: string) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { qrToken: token },
            include: {
                guest: {
                    select: {
                        fullName: true,
                        rsvpStatus: true,
                    },
                },
            },
        });

        if (!invitation) {
            throw new NotFoundException(`Invitation with token ${token} not found`);
        }

        // Only return QR if RSVP is confirmed
        if (invitation.guest.rsvpStatus !== 'CONFIRMED') {
            throw new NotFoundException('QR code only available for confirmed guests');
        }

        return {
            qrToken: invitation.qrToken,
            guestName: invitation.guest.fullName,
            message: 'QR code retrieved successfully',
        };
    }

    async getCalendar(token: string) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { qrToken: token },
            include: {
                event: true,
                guest: {
                    select: {
                        fullName: true,
                    },
                },
            },
        });

        if (!invitation) {
            throw new NotFoundException(`Invitation with token ${token} not found`);
        }

        // Generate .ics file content
        const icsContent = this.generateICS(invitation);

        return {
            filename: `${invitation.event.name.replace(/\s+/g, '_')}.ics`,
            content: icsContent,
            mimeType: 'text/calendar',
        };
    }

    private generateICS(invitation: any): string {
        const event = invitation.event;
        const startDate = new Date(event.date);
        const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // +4 hours

        const formatDate = (date: Date): string => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const icsLines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Monotickets//Event Calendar//ES',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${invitation.id}@monotickets.com`,
            `DTSTAMP:${formatDate(new Date())}`,
            `DTSTART:${formatDate(startDate)}`,
            `DTEND:${formatDate(endDate)}`,
            `SUMMARY:${event.name}`,
            `DESCRIPTION:${event.description || 'Evento especial'}`,
            `LOCATION:${event.location || 'Por confirmar'}`,
            'STATUS:CONFIRMED',
            'SEQUENCE:0',
            'END:VEVENT',
            'END:VCALENDAR',
        ];

        return icsLines.join('\r\n');
    }
}
