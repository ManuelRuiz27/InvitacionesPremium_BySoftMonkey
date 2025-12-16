import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  UseGuards,
  Patch,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { DirectorService } from './director.service';
import { FiltersDto } from './dto/filters.dto';
import { UpdatePlannerStatusDto } from './dto/update-planner-status.dto';

@ApiTags('director')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DIRECTOR_GLOBAL)
@Controller('director')
export class DirectorController {
  constructor(private readonly directorService: DirectorService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get global dashboard metrics' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'plannerId', required: false })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully',
    schema: {
      example: {
        metrics: {
          totalEvents: 150,
          totalPlanners: 25,
          totalGuests: 5000,
          totalInvitations: 5000,
          totalScans: 4200,
          confirmedGuests: 4500,
          attendanceRate: 84.0,
          confirmationRate: 90.0,
        },
        recentEvents: [],
        topPlanners: [],
      },
    },
  })
  getDashboard(@Query() filters: FiltersDto) {
    return this.directorService.getDashboard(filters);
  }

  @Get('planners')
  @ApiOperation({ summary: 'Get all planners' })
  @ApiResponse({
    status: 200,
    description: 'Planners retrieved successfully',
  })
  getPlanners() {
    return this.directorService.getPlanners();
  }

  @Patch('planners/:id')
  @ApiOperation({ summary: 'Activate or deactivate a planner' })
  @ApiResponse({ status: 200, description: 'Planner updated successfully' })
  async updatePlannerStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePlannerStatusDto,
  ) {
    const planner = await this.directorService.updatePlannerStatus(
      id,
      dto.active,
    );
    if (!planner) {
      throw new NotFoundException(`Planner with ID ${id} not found`);
    }
    return planner;
  }

  @Get('planners/:id')
  @ApiOperation({ summary: 'Get planner detail' })
  @ApiResponse({
    status: 200,
    description: 'Planner detail retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Planner not found' })
  async getPlannerDetail(@Param('id') id: string) {
    const planner = await this.directorService.getPlannerDetail(id);

    if (!planner) {
      throw new NotFoundException(`Planner with ID ${id} not found`);
    }

    return planner;
  }

  @Get('planners/:id/metrics')
  @ApiOperation({ summary: 'Get planner metrics' })
  @ApiResponse({
    status: 200,
    description: 'Planner metrics retrieved successfully',
    schema: {
      example: {
        totalEvents: 10,
        totalGuests: 500,
        totalInvitations: 500,
        totalScans: 420,
        confirmedGuests: 450,
        attendanceRate: 84.0,
        confirmationRate: 90.0,
      },
    },
  })
  getPlannerMetrics(@Param('id') id: string) {
    return this.directorService.getPlannerMetrics(id);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get all events (global view)' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'plannerId', required: false })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
  })
  getGlobalEvents(@Query() filters: FiltersDto) {
    return this.directorService.getGlobalEvents(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get global statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        totalUsers: 30,
        totalEvents: 150,
        totalGuests: 5000,
        totalInvitations: 5000,
        totalScans: 4200,
        eventsByMonth: [],
      },
    },
  })
  getStats() {
    return this.directorService.getStats();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get delivery/blocked alerts' })
  @ApiResponse({
    status: 200,
    description: 'Alerts retrieved successfully',
  })
  getAlerts() {
    return this.directorService.getAlerts();
  }
}
