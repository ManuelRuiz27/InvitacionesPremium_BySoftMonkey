import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Parser } from 'json2csv';
import { UserRole } from '@prisma/client';
import { Workbook } from 'exceljs';
import { AuthenticatedUser } from '../auth/types/authenticated-user.interface';

type ExportFormat = 'csv' | 'xlsx';

interface ExportResult {
  filename: string;
  content: string | Buffer;
  contentType: string;
}

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async exportGuests(
    eventId: string,
    user: AuthenticatedUser,
    format?: string,
  ): Promise<ExportResult> {
    const event = await this.ensureEventAccess(eventId, user);
    const guests = await this.prisma.guest.findMany({
      where: { eventId },
    });

    if (!guests.length)
      throw new NotFoundException('No guests found for this event');

    const fields = [
      'fullName',
      'phone',
      'email',
      'guestCount',
      'rsvpStatus',
      'inviteReceivedAt',
      'confirmedAt',
      'declinedAt',
    ];
    const json2csvParser = new Parser({ fields });
    const exportFormat = this.resolveFormat(format);
    if (exportFormat === 'xlsx') {
      const buffer = await this.generateWorkbook(
        [
          { header: 'Nombre', key: 'fullName' },
          { header: 'Teléfono', key: 'phone' },
          { header: 'Email', key: 'email' },
          { header: 'Invitados', key: 'guestCount' },
          { header: 'RSVP', key: 'rsvpStatus' },
          { header: 'Invite Received', key: 'inviteReceivedAt' },
          { header: 'Confirmed At', key: 'confirmedAt' },
          { header: 'Declined At', key: 'declinedAt' },
        ],
        guests,
        'Guests',
      );
      return {
        filename: `guests-${this.sanitizeFileName(event.name)}.xlsx`,
        content: buffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    const csv = json2csvParser.parse(guests);

    return {
      filename: `guests-${this.sanitizeFileName(event.name)}.csv`,
      content: csv,
      contentType: 'text/csv',
    };
  }

  async exportRsvp(
    eventId: string,
    user: AuthenticatedUser,
    format?: string,
  ): Promise<ExportResult> {
    const event = await this.ensureEventAccess(eventId, user);
    const guests = await this.prisma.guest.findMany({
      where: {
        eventId,
        rsvpStatus: { in: ['CONFIRMED', 'DECLINED'] },
      },
    });

    if (!guests.length) {
      // Return headers at least? Or empty.
      const exportFormat = this.resolveFormat(format);
      const extension = exportFormat === 'xlsx' ? 'xlsx' : 'csv';
      return {
        filename: `rsvp-${this.sanitizeFileName(event.name)}.${extension}`,
        content: '',
        contentType:
          exportFormat === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv',
      };
    }

    const fields = [
      'fullName',
      'rsvpStatus',
      'guestCount',
      'confirmedAt',
      'declinedAt',
    ];
    const exportFormat = this.resolveFormat(format);

    if (exportFormat === 'xlsx') {
      const buffer = await this.generateWorkbook(
        [
          { header: 'Nombre', key: 'fullName' },
          { header: 'RSVP', key: 'rsvpStatus' },
          { header: 'Invitados', key: 'guestCount' },
          { header: 'Confirmed At', key: 'confirmedAt' },
          { header: 'Declined At', key: 'declinedAt' },
        ],
        guests,
        'RSVP',
      );
      return {
        filename: `rsvp-${this.sanitizeFileName(event.name)}.xlsx`,
        content: buffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(guests);

    return {
      filename: `rsvp-${this.sanitizeFileName(event.name)}.csv`,
      content: csv,
      contentType: 'text/csv',
    };
  }

  async exportAttendance(
    eventId: string,
    user: AuthenticatedUser,
    format?: string,
  ): Promise<ExportResult> {
    const event = await this.ensureEventAccess(eventId, user);
    const scans = await this.prisma.scan.findMany({
      where: { eventId },
      include: { invitation: { include: { guest: true } } },
    });

    if (!scans.length) {
      const exportFormat = this.resolveFormat(format);
      const extension = exportFormat === 'xlsx' ? 'xlsx' : 'csv';
      return {
        filename: `attendance-${this.sanitizeFileName(event.name)}.${extension}`,
        content: '',
        contentType:
          exportFormat === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv',
      };
    }

    const data = scans.map((scan) => {
      const enteredNames = scan.enteredNames ?? [];
      return {
        guestName: scan.invitation?.guest?.fullName || 'Unknown',
        scannedAt: scan.scannedAt,
        status: scan.status,
        enteredNames: enteredNames.join(', '),
        peopleCount: enteredNames.length,
      };
    });

    const exportFormat = this.resolveFormat(format);
    if (exportFormat === 'xlsx') {
      const buffer = await this.generateWorkbook(
        [
          { header: 'Nombre', key: 'guestName' },
          { header: 'Fecha Escaneo', key: 'scannedAt' },
          { header: 'Estado', key: 'status' },
          { header: 'Ingresos', key: 'enteredNames' },
          { header: 'Personas', key: 'peopleCount' },
        ],
        data,
        'Attendance',
      );
      return {
        filename: `attendance-${this.sanitizeFileName(event.name)}.xlsx`,
        content: buffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    const fields = [
      'guestName',
      'scannedAt',
      'status',
      'enteredNames',
      'peopleCount',
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    return {
      filename: `attendance-${this.sanitizeFileName(event.name)}.csv`,
      content: csv,
      contentType: 'text/csv',
    };
  }

  private async ensureEventAccess(eventId: string, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, plannerId: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (!user) {
      throw new ForbiddenException('User context required');
    }

    if (user.role === UserRole.DIRECTOR_GLOBAL) {
      return event;
    }

    if (user.role === UserRole.PLANNER && event.plannerId === user.id) {
      return event;
    }

    throw new ForbiddenException(
      'You do not have permission to export this event',
    );
  }

  private sanitizeFileName(name: string) {
    return (
      name
        .replace(/[^a-z0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase() || 'event'
    );
  }

  private resolveFormat(format?: string): ExportFormat {
    return format && format.toLowerCase() === 'xlsx' ? 'xlsx' : 'csv';
  }

  private async generateWorkbook(
    columns: Array<{ header: string; key: string }>,
    rows: any[],
    sheetName: string,
  ) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.columns = columns;
    rows.forEach((row) => {
      worksheet.addRow(row);
    });
    return workbook.xlsx.writeBuffer();
  }
}
