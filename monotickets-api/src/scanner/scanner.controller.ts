import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ScannerService } from './scanner.service';
import { ScanValidationDto } from './dto/scan-validation.dto';
import { SyncScansDto } from './dto/sync-scans.dto';
import { ConfirmPartialEntryDto } from './dto/confirm-partial-entry.dto';

@ApiTags('scanner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scanner')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Post('validate')
  @Throttle({ default: { limit: 200, ttl: 60000 } }) // 200 scans per minute
  @Roles(UserRole.STAFF, UserRole.PLANNER)
  @ApiOperation({ summary: 'Validate QR code and register scan' })
  @ApiResponse({
    status: 200,
    description: 'QR validated successfully',
    schema: {
      example: {
        valid: true,
        status: 'VALID',
        guest: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          fullName: 'Juan Pérez',
          guestCount: 2,
          inviteType: 'STANDARD',
        },
        scan: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          scannedAt: '2025-12-05T15:00:00.000Z',
          scannedBy: '550e8400-e29b-41d4-a716-446655440002',
        },
        message: 'Acceso permitido',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid QR or duplicate scan' })
  validate(@Body() dto: ScanValidationDto) {
    return this.scannerService.validateQR(dto);
  }

  @Post('confirm-partial')
  @Roles(UserRole.STAFF, UserRole.PLANNER)
  @ApiOperation({ summary: 'Confirm partial entry for group invitation' })
  @ApiResponse({
    status: 200,
    description: 'Partial entry confirmed successfully',
    schema: {
      example: {
        success: true,
        scan: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          enteredNames: ['Juan Pérez', 'María García'],
          remainingCount: 2,
          status: 'VALID_PARTIAL',
        },
        message: 'Acceso permitido - Quedan 2 personas',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or too many names',
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  confirmPartial(@Body() dto: ConfirmPartialEntryDto) {
    return this.scannerService.confirmPartialEntry(
      dto.invitationId,
      dto.enteredNames,
      dto.scannedBy,
    );
  }

  @Get('history/:eventId')
  @Roles(UserRole.STAFF, UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Get scan history for an event' })
  @ApiResponse({
    status: 200,
    description: 'Scan history retrieved successfully',
  })
  getHistory(@Param('eventId') eventId: string) {
    return this.scannerService.getScanHistory(eventId);
  }

  @Post('sync')
  @Roles(UserRole.STAFF, UserRole.PLANNER)
  @ApiOperation({ summary: 'Sync offline scans' })
  @ApiResponse({
    status: 200,
    description: 'Scans synced successfully',
    schema: {
      example: {
        synced: 45,
        failed: 5,
        results: [],
      },
    },
  })
  sync(@Body() dto: SyncScansDto) {
    return this.scannerService.syncOfflineScans(dto);
  }
}
