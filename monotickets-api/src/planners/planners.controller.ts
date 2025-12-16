import { Controller, Get, Patch, UseGuards, Req, Body } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PlannersService } from './planners.service';
import { UpdatePlannerSettingsDto } from './dto/update-planner-settings.dto';
import { AuthenticatedRequest } from '../auth/types/authenticated-user.interface';

@ApiTags('planners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('planners')
export class PlannersController {
  constructor(private readonly plannersService: PlannersService) {}

  @Get('me')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Get current planner profile' })
  @ApiResponse({ status: 200, description: 'Planner profile returned' })
  getMe(@Req() req: AuthenticatedRequest) {
    return this.plannersService.getProfile(req.user.id);
  }

  @Get('me/settings')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({
    summary: 'Get planner settings (brand defaults, invite mode)',
  })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  getSettings(@Req() req: AuthenticatedRequest) {
    return this.plannersService.getSettings(req.user.id, req.user);
  }

  @Patch('me/settings')
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Update planner settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePlannerSettingsDto,
  ) {
    return this.plannersService.updateSettings(req.user.id, req.user, dto);
  }
}
