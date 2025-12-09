import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { BulkUploadDto } from './dto/bulk-upload.dto';

@ApiTags('guests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class GuestsController {
    constructor(private readonly guestsService: GuestsService) { }

    @Post('events/:eventId/guests')
    @Roles(UserRole.PLANNER)
    @ApiOperation({ summary: 'Create a new guest for an event' })
    @ApiResponse({
        status: 201,
        description: 'Guest created successfully',
    })
    @ApiResponse({ status: 404, description: 'Event not found' })
    create(
        @Param('eventId') eventId: string,
        @Body() createGuestDto: CreateGuestDto,
    ) {
        return this.guestsService.create(eventId, createGuestDto);
    }

    @Post('events/:eventId/guests/bulk')
    @Roles(UserRole.PLANNER)
    @ApiOperation({ summary: 'Bulk create guests (CSV upload)' })
    @ApiResponse({
        status: 201,
        description: 'Guests created successfully',
        schema: {
            example: {
                message: 'Successfully created 50 guests',
                count: 50,
                guests: [],
            },
        },
    })
    @ApiResponse({ status: 400, description: 'Invalid CSV data' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    bulkCreate(
        @Param('eventId') eventId: string,
        @Body() bulkUploadDto: BulkUploadDto,
    ) {
        return this.guestsService.bulkCreate(eventId, bulkUploadDto);
    }

    @Get('events/:eventId/guests')
    @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
    @ApiOperation({ summary: 'Get all guests for an event' })
    @ApiResponse({
        status: 200,
        description: 'Guests retrieved successfully',
    })
    findAll(@Param('eventId') eventId: string) {
        return this.guestsService.findAll(eventId);
    }

    @Get('events/:eventId/guests/stats')
    @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
    @ApiOperation({ summary: 'Get guest statistics for an event' })
    @ApiResponse({
        status: 200,
        description: 'Guest stats retrieved successfully',
        schema: {
            example: {
                totalGuests: 150,
                confirmedGuests: 120,
                pendingGuests: 25,
                declinedGuests: 5,
                totalGuestCount: 300,
            },
        },
    })
    getStats(@Param('eventId') eventId: string) {
        return this.guestsService.getGuestStats(eventId);
    }

    @Get('guests/:id')
    @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
    @ApiOperation({ summary: 'Get guest by ID' })
    @ApiResponse({
        status: 200,
        description: 'Guest retrieved successfully',
    })
    @ApiResponse({ status: 404, description: 'Guest not found' })
    findOne(@Param('id') id: string) {
        return this.guestsService.findOne(id);
    }

    @Patch('guests/:id')
    @Roles(UserRole.PLANNER)
    @ApiOperation({ summary: 'Update guest' })
    @ApiResponse({
        status: 200,
        description: 'Guest updated successfully',
    })
    @ApiResponse({ status: 404, description: 'Guest not found' })
    update(@Param('id') id: string, @Body() updateGuestDto: UpdateGuestDto) {
        return this.guestsService.update(id, updateGuestDto);
    }

    @Delete('guests/:id')
    @Roles(UserRole.PLANNER)
    @ApiOperation({ summary: 'Delete guest' })
    @ApiResponse({
        status: 200,
        description: 'Guest deleted successfully',
    })
    @ApiResponse({ status: 404, description: 'Guest not found' })
    remove(@Param('id') id: string) {
        return this.guestsService.remove(id);
    }
}
