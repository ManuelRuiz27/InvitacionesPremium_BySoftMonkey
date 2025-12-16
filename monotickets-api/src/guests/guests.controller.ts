import {
<<<<<<< HEAD
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
=======
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Res,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
>>>>>>> ff183bdbed4957932f8d0fec1d925d02cf1e8910
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { GuestsService } from './guests.service';
import { CsvImportService } from './csv-import.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { BulkUploadDto } from './dto/bulk-upload.dto';

@ApiTags('guests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class GuestsController {
<<<<<<< HEAD
  constructor(private readonly guestsService: GuestsService) {}
=======
    constructor(
        private readonly guestsService: GuestsService,
        private readonly csvImportService: CsvImportService,
    ) { }
>>>>>>> ff183bdbed4957932f8d0fec1d925d02cf1e8910

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

<<<<<<< HEAD
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
=======
    @Post('events/:eventId/guests/import')
    @Roles(UserRole.PLANNER)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Import guests from CSV file' })
    @ApiResponse({
        status: 201,
        description: 'CSV import completed',
        schema: {
            example: {
                created: 45,
                skipped: 3,
                invalid: 2,
                errors: [
                    { row: 5, data: {}, reason: 'Missing fullName' },
                ],
                summary: {
                    totalRows: 50,
                    successRate: 90.0,
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: 'Invalid CSV file or data' })
    async importCsv(
        @Param('eventId') eventId: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        return this.csvImportService.importGuests(
            eventId,
            file.buffer,
            user.id,
        );
    }

    @Get('events/:eventId/guests/import/template')
    @Roles(UserRole.PLANNER)
    @ApiOperation({ summary: 'Download CSV template' })
    @ApiResponse({
        status: 200,
        description: 'CSV template file',
    })
    downloadTemplate(@Res() res: Response) {
        const template = this.csvImportService.generateTemplate();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="guests_template.csv"');
        res.send(template);
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
>>>>>>> ff183bdbed4957932f8d0fec1d925d02cf1e8910

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
