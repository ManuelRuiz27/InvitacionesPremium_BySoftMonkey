import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/types/authenticated-user.interface';

@ApiTags('metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('events/:eventId')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Get metrics for a specific event' })
  @ApiResponse({ status: 200, description: 'Metrics calculated successfully' })
  async getMetrics(
    @Param('eventId') eventId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.metricsService.getEventMetrics(eventId, req.user);
  }

  @Get('global')
  @Roles(UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Get global KPIs across all events' })
  @ApiResponse({
    status: 200,
    description: 'Global metrics calculated successfully',
  })
  async getGlobalMetrics(@Req() req: AuthenticatedRequest) {
    return this.metricsService.getGlobalMetrics(req.user);
  }
}
