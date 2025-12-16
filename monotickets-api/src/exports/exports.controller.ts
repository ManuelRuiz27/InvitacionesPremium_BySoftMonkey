import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ExportsService } from './exports.service';
import type { Response } from 'express';
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

@ApiTags('exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('guests/:eventId')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Export guests list (CSV)' })
  @ApiResponse({ status: 200, description: 'CSV generated successfully' })
  async exportGuests(
    @Param('eventId') eventId: string,
    @Query('format') format: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const result = await this.exportsService.exportGuests(
      eventId,
      req.user,
      format,
    );
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });
    res.send(result.content);
  }

  @Get('rsvp/:eventId')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Export RSVP responses (CSV)' })
  @ApiResponse({ status: 200, description: 'CSV generated successfully' })
  async exportRsvp(
    @Param('eventId') eventId: string,
    @Query('format') format: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const result = await this.exportsService.exportRsvp(
      eventId,
      req.user,
      format,
    );
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });
    res.send(result.content);
  }

  @Get('attendance/:eventId')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Export attendance scans (CSV)' })
  @ApiResponse({ status: 200, description: 'CSV generated successfully' })
  async exportAttendance(
    @Param('eventId') eventId: string,
    @Query('format') format: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const result = await this.exportsService.exportAttendance(
      eventId,
      req.user,
      format,
    );
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });
    res.send(result.content);
  }
}
