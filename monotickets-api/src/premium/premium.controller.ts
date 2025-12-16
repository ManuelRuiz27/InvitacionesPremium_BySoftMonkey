import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PremiumService } from './premium.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdatePremiumConfigDto } from './dto/update-premium-config.dto';
import { AuthenticatedRequest } from '../auth/types/authenticated-user.interface';

@ApiTags('premium')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events/:eventId/premium-config')
export class PremiumController {
  constructor(private readonly premiumService: PremiumService) {}

  @Get()
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Obtener la configuración premium del evento' })
  @ApiResponse({
    status: 200,
    description: 'Configuración obtenida correctamente',
  })
  getConfig(
    @Param('eventId') eventId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.premiumService.getConfig(eventId, req.user);
  }

  @Patch()
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Actualizar la configuración premium del evento' })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada correctamente',
  })
  updateConfig(
    @Param('eventId') eventId: string,
    @Body() dto: UpdatePremiumConfigDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.premiumService.updateConfig(eventId, req.user, dto);
  }
}
