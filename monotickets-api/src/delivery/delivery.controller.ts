import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseGuards,
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
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';

@ApiTags('delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DeliveryController {
    constructor(
        private readonly deliveryOrchestrator: DeliveryOrchestratorService,
    ) { }

    @Post('invitations/:id/send')
    @Roles(UserRole.PLANNER)
    @ApiOperation({ summary: 'Send invitation via dual-channel (SMS + WhatsApp)' })
    @ApiResponse({
        status: 200,
        description: 'Invitation sent successfully',
        schema: {
            example: {
                success: true,
                channels: [
                    {
                        channel: 'MOCK_SMS',
                        success: true,
                        providerId: 'MOCK_SMS_1234567890',
                        attemptNumber: 1,
                    },
                    {
                        channel: 'MOCK_WHATSAPP',
                        success: true,
                        providerId: 'MOCK_WA_1234567890',
                        attemptNumber: 1,
                    },
                ],
                invalidNumber: false,
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Invitation not found' })
    async sendInvitation(@Param('id') id: string) {
        return this.deliveryOrchestrator.sendInvitation(id);
    }

    @Post('events/:eventId/invitations/send-bulk')
    @Roles(UserRole.PLANNER)
    @ApiOperation({ summary: 'Send multiple invitations in bulk' })
    @ApiResponse({
        status: 200,
        description: 'Bulk send completed',
        schema: {
            example: {
                total: 50,
                successful: 47,
                failed: 2,
                invalidNumbers: 1,
            },
        },
    })
    sendBulk(@Body() body: { invitationIds: string[] }) {
        return this.deliveryOrchestrator.sendBulk(body.invitationIds);
    }

    @Get('events/:eventId/delivery/summary')
    @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
    @ApiOperation({ summary: 'Get delivery summary for event' })
    @ApiResponse({
        status: 200,
        description: 'Delivery summary retrieved',
        schema: {
            example: {
                totalInvitations: 100,
                delivered: 95,
                failed: 4,
                invalidNumbers: 1,
                deliveryRate: 95.0,
            },
        },
    })
    async getDeliverySummary(@Param('eventId') eventId: string) {
        // This would query the database for delivery stats
        // For now, return a placeholder
        return {
            message: 'Delivery summary endpoint - to be implemented with metrics module',
        };
    }
}
