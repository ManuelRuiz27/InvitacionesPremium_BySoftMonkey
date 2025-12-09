import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RsvpService } from './rsvp.service';
import { RsvpConfigDto } from './dto/rsvp-config.dto';

@ApiTags('rsvp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class RsvpController {
    constructor(private readonly rsvpService: RsvpService) { }

    @Get('events/:eventId/rsvp-config')
    @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
    @ApiOperation({ summary: 'Get RSVP configuration for an event' })
    @ApiResponse({
        status: 200,
        description: 'RSVP config retrieved successfully',
        schema: {
            example: {
                eventId: '550e8400-e29b-41d4-a716-446655440000',
                enabled: true,
                deadline: '2025-12-20T23:59:59.999Z',
                message: 'Por favor confirma tu asistencia',
                allowPlusOnes: true,
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Event not found' })
    getConfig(@Param('eventId') eventId: string) {
        return this.rsvpService.getConfig(eventId);
    }

    @Post('events/:eventId/rsvp-config')
    @Roles(UserRole.PLANNER)
    @ApiOperation({ summary: 'Create/Update RSVP configuration' })
    @ApiResponse({
        status: 201,
        description: 'RSVP config created successfully',
    })
    @ApiResponse({ status: 404, description: 'Event not found' })
    createConfig(@Body() configDto: RsvpConfigDto) {
        return this.rsvpService.createConfig(configDto);
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
