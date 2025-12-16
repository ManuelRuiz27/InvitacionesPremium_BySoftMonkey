import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RsvpDto } from './dto/rsvp.dto';
import {
  CalendarRemindersDto,
  CALENDAR_REMINDER_OPTIONS,
} from './dto/calendar-reminders.dto';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import { DEFAULT_PREMIUM_CONFIG } from '../premium/premium.constants';

@Injectable()
export class GuestService {
  private readonly inviteBaseUrl =
    process.env.PUBLIC_APP_URL || 'https://monotickets.com';
  private readonly memoryTtlMonths = parseInt(
    process.env.MEMORY_TTL_MONTHS ?? '12',
    10,
  );

  constructor(private prisma: PrismaService) {}

  async getInvitation(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { qrToken: token },
      include: {
        guest: true,
        event: {
          select: {
            id: true,
            name: true,
            eventAt: true,
            location: true,
            venueText: true,
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
      throw new NotFoundException(
        `Invitation with token ${rsvpDto.qrToken} not found`,
      );
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
      throw new NotFoundException(
        'QR code only available for confirmed guests',
      );
    }

    return {
      qrToken: invitation.qrToken,
      guestName: invitation.guest.fullName,
      message: 'QR code retrieved successfully',
    };
  }

  async getCalendar(token: string, remindersDto?: CalendarRemindersDto) {
    const reminders = this.validateReminders(remindersDto?.reminders);
    const invitation = await this.prisma.invitation.findUnique({
      where: { qrToken: token },
      include: {
        event: true,
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

    if (invitation.event.status === 'BLOCKED') {
      throw new ForbiddenException('Event is blocked');
    }

    if (invitation.guest.rsvpStatus === 'DECLINED') {
      throw new ConflictException(
        'Declined guests cannot request calendar files',
      );
    }

    // Generate .ics file content
    const icsContent = this.generateICS(invitation, reminders);

    return {
      filename: `${invitation.event.name.replace(/\s+/g, '_')}.ics`,
      content: icsContent,
      mimeType: 'text/calendar',
    };
  }

  async getMemoryView(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { qrToken: token },
      include: {
        event: {
          include: {
            premiumConfig: true,
          },
        },
        guest: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException(`Invitation with token ${token} not found`);
    }

    const expiration = dayjs(invitation.event.eventAt).add(
      this.memoryTtlMonths,
      'month',
    );
    if (dayjs().isAfter(expiration)) {
      throw new NotFoundException('Memory no longer available');
    }

    const config = invitation.event.premiumConfig
      ? {
          effect: invitation.event.premiumConfig.effect,
          colors: invitation.event.premiumConfig.colors,
          sections: invitation.event.premiumConfig.sections,
          reduceMotionDefault:
            invitation.event.premiumConfig.reduceMotionDefault,
        }
      : DEFAULT_PREMIUM_CONFIG;

    return {
      event: {
        id: invitation.event.id,
        name: invitation.event.name,
        eventAt: invitation.event.eventAt,
        location: invitation.event.location,
        venueText: invitation.event.venueText,
        description: invitation.event.description,
      },
      guest: {
        id: invitation.guest.id,
        fullName: invitation.guest.fullName,
        email: invitation.guest.email,
        rsvpStatus: invitation.guest.rsvpStatus,
        guestCount: invitation.guest.guestCount,
      },
      invitation: {
        id: invitation.id,
        status: invitation.status,
        remainingCount: invitation.remainingCount,
      },
      premium: config,
      sections: config.sections,
      links: {
        pdf: `${this.inviteBaseUrl}/public/invite/${invitation.qrToken}/memory.pdf`,
      },
      qrStatus: 'MEMORY_ONLY',
    };
  }

  async getMemoryPdf(token: string) {
    const memory = await this.getMemoryView(token);
    const buffer = await this.generateMemoryPdf(memory);

    return {
      filename: `memory-${memory.event.id}.pdf`,
      content: buffer,
      mimeType: 'application/pdf',
    };
  }

  private generateICS(invitation: any, reminders: string[]): string {
    const event = invitation.event;
    const startDate = new Date(event.eventAt);
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // +4 hours

    const formatDateInCDMX = (date: Date): string => {
      const locale = date.toLocaleString('sv-SE', {
        timeZone: 'America/Mexico_City',
        hour12: false,
      });
      const [datePart, timePart] = locale.split(' ');
      return `${datePart.replace(/-/g, '')}T${timePart.replace(/:/g, '')}`;
    };

    const locationText = event.venueText || event.location || 'Por confirmar';

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Monotickets//Event Calendar//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${invitation.id}@monotickets.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      'DTSTART;TZID=America/Mexico_City:' + formatDateInCDMX(startDate),
      'DTEND;TZID=America/Mexico_City:' + formatDateInCDMX(endDate),
      `SUMMARY:${event.name}`,
      `DESCRIPTION:${event.description || 'Evento especial'}`,
      `LOCATION:${locationText}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      `URL:${this.inviteBaseUrl}/public/invite/${invitation.qrToken}`,
    ];

    reminders.forEach((reminder) => {
      icsLines.push('BEGIN:VALARM');
      icsLines.push(`TRIGGER:-${reminder}`);
      icsLines.push('ACTION:DISPLAY');
      icsLines.push('DESCRIPTION:Recordatorio de evento Monotickets');
      icsLines.push('END:VALARM');
    });

    icsLines.push('END:VEVENT');
    icsLines.push('END:VCALENDAR');

    return icsLines.join('\r\n');
  }

  private validateReminders(reminders?: string[]) {
    if (!reminders || reminders.length === 0) {
      return [];
    }

    if (reminders.length > 4) {
      throw new BadRequestException('Solo se permiten hasta 4 recordatorios');
    }

    const unique = [...new Set(reminders)];
    const invalid = unique.filter(
      (reminder) => !CALENDAR_REMINDER_OPTIONS.includes(reminder as any),
    );
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Recordatorios inválidos: ${invalid.join(', ')}`,
      );
    }

    return unique;
  }

  private generateMemoryPdf(memory: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      doc.fontSize(20).text(memory.event.name, { align: 'center' });
      doc.moveDown();
      doc
        .fontSize(12)
        .text(
          `Fecha: ${new Date(memory.event.eventAt).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`,
        );
      const venueLine = memory.event.venueText || memory.event.location;
      if (venueLine) {
        doc.text(`Lugar: ${venueLine}`);
      }
      doc.moveDown();
      doc.text(`Invitado: ${memory.guest.fullName}`);
      doc.text(`Estado RSVP: ${memory.guest.rsvpStatus}`);
      if (memory.event.description) {
        doc.moveDown();
        doc.text(memory.event.description, { align: 'left' });
      }

      if (memory.premium) {
        doc.moveDown();
        doc.text(`Efecto: ${memory.premium.effect}`);
        const sections = memory.premium.sections || {};

        if (sections.story?.enabled && sections.story.text) {
          doc.moveDown();
          doc.fontSize(14).text('Historia', { underline: true });
          doc.fontSize(12).text(sections.story.text);
        }

        if (sections.location?.enabled && sections.location.placeText) {
          doc.moveDown();
          doc.fontSize(14).text('Ubicación', { underline: true });
          doc.fontSize(12).text(sections.location.placeText);
          if (sections.location.mapUrl) {
            doc.text(`Mapa: ${sections.location.mapUrl}`);
          }
        }

        if (Array.isArray(sections.extras) && sections.extras.length > 0) {
          doc.moveDown();
          doc.fontSize(14).text('Extras', { underline: true });
          sections.extras.slice(0, 2).forEach((extra) => {
            doc
              .fontSize(12)
              .text(`- ${extra.title || 'Extra'}: ${extra.text || ''}`);
            if (extra.linkUrl) {
              doc.text(`  Link: ${extra.linkUrl}`);
            }
          });
        }
      }

      doc.end();
    });
  }
}
