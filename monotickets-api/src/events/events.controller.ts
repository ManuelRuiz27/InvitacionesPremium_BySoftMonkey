import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AuthenticatedRequest } from '../auth/types/authenticated-user.interface';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Boda de Juan y María',
        date: '2025-12-25T18:00:00.000Z',
        location: 'Jardín Las Rosas, CDMX',
        description: 'Celebración de nuestra boda',
        plannerId: '550e8400-e29b-41d4-a716-446655440001',
        active: true,
        createdAt: '2025-12-05T15:00:00.000Z',
        updatedAt: '2025-12-05T15:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Get all events' })
  @ApiQuery({
    name: 'plannerId',
    required: false,
    description: 'Filter by planner ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
  })
  findAll(@Query('plannerId') plannerId?: string) {
    return this.eventsService.findAll(plannerId);
  }

  @Get(':id')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Event retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Get event statistics' })
  @ApiResponse({
    status: 200,
    description: 'Event stats retrieved successfully',
    schema: {
      example: {
        totalGuests: 150,
        totalInvitations: 150,
        totalScans: 120,
        confirmedGuests: 140,
      },
    },
  })
  getStats(@Param('id') id: string) {
    return this.eventsService.getEventStats(id);
  }

  @Patch(':id/publish')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Publish event' })
  @ApiResponse({ status: 200, description: 'Event published successfully' })
  publish(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.eventsService.publish(id, req.user);
  }

  @Patch(':id/close')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Close event' })
  @ApiResponse({ status: 200, description: 'Event closed successfully' })
  close(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.eventsService.close(id, req.user);
  }

  @Patch(':id/block')
  @Roles(UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Block event' })
  @ApiResponse({ status: 200, description: 'Event blocked successfully' })
  block(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.eventsService.block(id, req.user);
  }

  @Patch(':id/unblock')
  @Roles(UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Unblock event' })
  @ApiResponse({ status: 200, description: 'Event unblocked successfully' })
  unblock(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.eventsService.unblock(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.eventsService.update(id, updateEventDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Delete event (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Event deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.eventsService.remove(id, req.user);
  }
}
