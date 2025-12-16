import { Controller, Get, Post, Body, Param, Res } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { GuestService } from './guest.service';
import { RsvpDto } from './dto/rsvp.dto';

@ApiTags('guest')
@Controller('guest')
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  @Get('invitation/:token')
  @ApiOperation({ summary: 'Get invitation details (public)' })
  @ApiResponse({
    status: 200,
    description: 'Invitation retrieved successfully',
    schema: {
      example: {
        invitation: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          qrToken: 'EV-550E8400-E29B41D4-ABC123-DEF456',
          status: 'SENT',
        },
        guest: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          fullName: 'Juan Pérez',
          guestCount: 2,
          rsvpStatus: 'PENDING',
        },
        event: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Boda de Juan y María',
          date: '2025-12-25T18:00:00.000Z',
          location: 'Jardín Las Rosas, CDMX',
          description: 'Celebración de nuestra boda',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  getInvitation(@Param('token') token: string) {
    return this.guestService.getInvitation(token);
  }

  @Post('rsvp')
  @ApiOperation({ summary: 'Confirm RSVP (public)' })
  @ApiResponse({
    status: 200,
    description: 'RSVP confirmed successfully',
    schema: {
      example: {
        message: 'RSVP confirmed successfully',
        guest: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          fullName: 'Juan Pérez',
          rsvpStatus: 'CONFIRMED',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  confirmRsvp(@Body() rsvpDto: RsvpDto) {
    return this.guestService.confirmRsvp(rsvpDto);
  }

  @Get('qr/:token')
  @ApiOperation({ summary: 'Get QR code (public, only for confirmed guests)' })
  @ApiResponse({
    status: 200,
    description: 'QR code retrieved successfully',
    schema: {
      example: {
        qrToken: 'EV-550E8400-E29B41D4-ABC123-DEF456',
        guestName: 'Juan Pérez',
        message: 'QR code retrieved successfully',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'QR code not available' })
  getQR(@Param('token') token: string) {
    return this.guestService.getQR(token);
  }

  @Get('calendar/:token')
  @ApiOperation({ summary: 'Download calendar file .ics (public)' })
  @ApiResponse({
    status: 200,
    description: 'Calendar file generated successfully',
    headers: {
      'Content-Type': {
        description: 'text/calendar',
      },
      'Content-Disposition': {
        description: 'attachment; filename="event.ics"',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async getCalendar(@Param('token') token: string, @Res() res: any) {
    const calendar = await this.guestService.getCalendar(token);

    res.setHeader('Content-Type', calendar.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${calendar.filename}"`,
    );
    res.send(calendar.content);
  }
}
