import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { InvitationsService } from './invitations.service';
import { GenerateInvitationsDto } from './dto/generate-invitations.dto';
import { SendInvitationsDto } from './dto/send-invitations.dto';

@ApiTags('invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class InvitationsController {
    constructor(private readonly invitationsService: InvitationsService) { }

    @Post('events/:eventId/invitations/generate')
    @Roles(UserRole.PLANNER)
    @ApiOperation({ summary: 'Generate invitations for guests' })
    @ApiResponse({
        status: 201,
        description: 'Invitations generated successfully',
        schema: {
            example: {
                message: 'Successfully generated 50 invitations',
                count: 50,
                invitations: [],
            },
        },
    })
    @ApiResponse({ status: 400, description: 'Invalid request or guests already have invitations' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    generate(
        @Param('eventId') eventId: string,
        @Body() generateDto: GenerateInvitationsDto,
    ) {
        return this.invitationsService.generate(eventId, generateDto);
    }

    @Get('events/:eventId/invitations')
    @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
    @ApiOperation({ summary: 'Get all invitations for an event' })
    @ApiResponse({
        status: 200,
        description: 'Invitations retrieved successfully',
    })
    findAll(@Param('eventId') eventId: string) {
        return this.invitationsService.findAll(eventId);
    }

    @Get('events/:eventId/invitations/stats')
    @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
    @ApiOperation({ summary: 'Get invitation statistics for an event' })
    @ApiResponse({
        status: 200,
        description: 'Invitation stats retrieved successfully',
        schema: {
            example: {
                totalInvitations: 150,
                sentInvitations: 120,
                deliveredInvitations: 100,
                pendingInvitations: 30,
                failedInvitations: 0,
            },
        },
    })
    getStats(@Param('eventId') eventId: string) {
        return this.invitationsService.getInvitationStats(eventId);
    }

    @Get('invitations/:id')
    @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
    @ApiOperation({ summary: 'Get invitation by ID' })
    @ApiResponse({
        status: 200,
        description: 'Invitation retrieved successfully',
    })
    @ApiResponse({ status: 404, description: 'Invitation not found' })
    findOne(@Param('id') id: string) {
        return this.invitationsService.findOne(id);
    }

    @Get('invitations/qr/:qrToken')
    @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL, UserRole.STAFF)
    @ApiOperation({ summary: 'Get invitation by QR token (public)' })
    @ApiResponse({
        status: 200,
        description: 'Invitation retrieved successfully',
    })
    @ApiResponse({ status: 404, description: 'Invitation not found' })
    findByQRToken(@Param('qrToken') qrToken: string) {
        return this.invitationsService.findByQRToken(qrToken);
    }

    @Post('invitations/send')
    @Roles(UserRole.PLANNER)
    @ApiOperation({ summary: 'Send invitations via SMS/Email/WhatsApp' })
    @ApiResponse({
        status: 200,
        description: 'Invitations sent successfully',
        schema: {
            example: {
                message: 'Successfully sent 50 invitations',
                count: 50,
                method: 'SMS',
                invitations: [],
            },
        },
    })
    @ApiResponse({ status: 400, description: 'Invalid request' })
    send(@Body() sendDto: SendInvitationsDto) {
        return this.invitationsService.send(sendDto);
    }
}
