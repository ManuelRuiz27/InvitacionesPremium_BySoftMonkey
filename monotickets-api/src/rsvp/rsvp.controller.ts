import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RsvpService } from './rsvp.service';
import { UpdateRsvpConfigDto } from './dto/update-rsvp-config.dto';
import { AuthenticatedRequest } from '../auth/types/authenticated-user.interface';

@ApiTags('rsvp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class RsvpController {
  constructor(private readonly rsvpService: RsvpService) {}

  @Get('events/:eventId/rsvp-config')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Get RSVP configuration for an event' })
  @ApiResponse({
    status: 200,
    description: 'RSVP config retrieved successfully',
    schema: {
      example: {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        allowRsvp: true,
        rsvpDeadlineDays: 0,
        revocationWindowDays: 20,
        updatedAt: '2025-12-13T21:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getConfig(
    @Param('eventId') eventId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rsvpService.getConfig(eventId, req.user);
  }

  @Post('events/:eventId/rsvp-config')
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Create/Update RSVP configuration' })
  @ApiResponse({
    status: 201,
    description: 'RSVP config created successfully',
    schema: {
      example: {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        allowRsvp: true,
        rsvpDeadlineDays: 5,
        revocationWindowDays: 20,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  createConfig(
    @Param('eventId') eventId: string,
    @Body() configDto: UpdateRsvpConfigDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rsvpService.createConfig(eventId, req.user, configDto);
  }

  @Get('events/:eventId/confirmations')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Get RSVP confirmations list' })
  @ApiResponse({
    status: 200,
    description: 'Confirmations retrieved successfully',
    schema: {
      example: {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        total: 150,
        confirmed: 120,
        declined: 10,
        pending: 20,
        confirmationRate: 80.0,
        guests: [],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getConfirmations(@Param('eventId') eventId: string) {
    return this.rsvpService.getConfirmations(eventId);
  }
}
