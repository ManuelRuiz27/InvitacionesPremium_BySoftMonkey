import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { BulkUploadDto } from './dto/bulk-upload.dto';

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  async create(eventId: string, createGuestDto: CreateGuestDto) {
    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const guest = await this.prisma.guest.create({
      data: {
        ...createGuestDto,
        eventId,
      },
    });

    return guest;
  }

  async bulkCreate(eventId: string, bulkUploadDto: BulkUploadDto) {
    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Use transaction for bulk insert
    const guests = await this.prisma.$transaction(
      bulkUploadDto.guests.map((guestDto) =>
        this.prisma.guest.create({
          data: {
            ...guestDto,
            eventId,
          },
        }),
      ),
    );

    return {
      message: `Successfully created ${guests.length} guests`,
      count: guests.length,
      guests,
    };
  }

  async findAll(eventId: string) {
    const guests = await this.prisma.guest.findMany({
      where: { eventId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return guests;
  }

  async findOne(id: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
        invitations: true,
      },
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID ${id} not found`);
    }

    return guest;
  }

  async update(id: string, updateGuestDto: UpdateGuestDto) {
    // Verify guest exists
    await this.findOne(id);

    const guest = await this.prisma.guest.update({
      where: { id },
      data: updateGuestDto,
    });

    return guest;
  }

  async remove(id: string) {
    // Verify guest exists
    await this.findOne(id);

    await this.prisma.guest.delete({
      where: { id },
    });

    return { message: 'Guest deleted successfully' };
  }

  async getGuestStats(eventId: string) {
    const totalGuests = await this.prisma.guest.count({
      where: { eventId },
    });

    const confirmedGuests = await this.prisma.guest.count({
      where: {
        eventId,
        rsvpStatus: 'CONFIRMED',
      },
    });

    const pendingGuests = await this.prisma.guest.count({
      where: {
        eventId,
        rsvpStatus: 'PENDING',
      },
    });

    const declinedGuests = await this.prisma.guest.count({
      where: {
        eventId,
        rsvpStatus: 'DECLINED',
      },
    });

    const totalGuestCount = await this.prisma.guest.aggregate({
      where: { eventId },
      _sum: {
        guestCount: true,
      },
    });

    return {
      totalGuests,
      confirmedGuests,
      pendingGuests,
      declinedGuests,
      totalGuestCount: totalGuestCount._sum.guestCount || 0,
    };
  }

  // Helper method to parse CSV data
  parseCSV(csvData: string): CreateGuestDto[] {
    const lines = csvData.trim().split('\n');

    if (lines.length < 2) {
      throw new BadRequestException('CSV file is empty or invalid');
    }

    // Skip header row
    const dataLines = lines.slice(1);

    const guests: CreateGuestDto[] = dataLines.map((line, index) => {
      const [fullName, phone, email, guestCount] = line
        .split(',')
        .map((s) => s.trim());

      if (!fullName) {
        throw new BadRequestException(`Row ${index + 2}: fullName is required`);
      }

      const count = parseInt(guestCount) || 1;

      if (count < 1 || count > 10) {
        throw new BadRequestException(
          `Row ${index + 2}: guestCount must be between 1 and 10`,
        );
      }

      return {
        fullName,
        phone: phone || undefined,
        email: email || undefined,
        guestCount: count,
      };
    });

    return guests;
  }
}
