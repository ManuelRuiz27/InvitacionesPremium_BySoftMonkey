import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { SendDeliveryDto } from './dto/send-delivery.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('send')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Send invitations via SMS and WhatsApp' })
  @ApiResponse({ status: 200, description: 'Delivery process started' })
  send(@Body() dto: SendDeliveryDto) {
    return this.deliveryService.sendBulk(dto);
  }

  @Get('stats/:eventId')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Get delivery statistics for an event' })
  @ApiResponse({ status: 200, description: 'Delivery statistics' })
  getStats(@Param('eventId') eventId: string) {
    return this.deliveryService.getDeliveryStats(eventId);
  }
}
