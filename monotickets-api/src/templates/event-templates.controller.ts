import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SelectTemplateDto } from './dto/select-template.dto';
import { UpdateQrPlacementDto } from './dto/update-qr-placement.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from '../auth/types/authenticated-user.interface';
import type { Express } from 'express';

@ApiTags('templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events/:eventId/pdf-template')
export class EventTemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post('select')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Assign catalog template to event' })
  @ApiResponse({ status: 200, description: 'Template assigned' })
  selectTemplate(
    @Param('eventId') eventId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SelectTemplateDto,
  ) {
    return this.templatesService.selectTemplateForEvent(eventId, req.user, dto);
  }

  @Post('upload')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Upload custom PDF for event' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'Custom template stored' })
  @UseInterceptors(FileInterceptor('file'))
  uploadCustomTemplate(
    @Param('eventId') eventId: string,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.templatesService.uploadCustomTemplateForEvent(
      eventId,
      req.user,
      file,
    );
  }

  @Patch('qr-placement')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Update QR placement for event PDF' })
  @ApiResponse({ status: 200, description: 'Placement updated' })
  updateQrPlacement(
    @Param('eventId') eventId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateQrPlacementDto,
  ) {
    return this.templatesService.updateQrPlacement(eventId, req.user, dto);
  }
}
