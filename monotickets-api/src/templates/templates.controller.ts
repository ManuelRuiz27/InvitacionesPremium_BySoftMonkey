import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UploadTemplateDto } from './dto/upload-template.dto';
import { AuthenticatedRequest } from '../auth/types/authenticated-user.interface';
import type { Express } from 'express';

@ApiTags('templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get('pdf')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'List available PDF invitation templates' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category (BODA, XV, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  listPdfTemplates(@Query('category') category?: string) {
    return this.templatesService.listPdfTemplates(category);
  }

  @Post('pdf/upload')
  @Roles(UserRole.PLANNER, UserRole.DIRECTOR_GLOBAL)
  @ApiOperation({ summary: 'Upload PDF template to catalog' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Vintage Rose' },
        category: { type: 'string', example: 'BODA' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['name', 'category', 'file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Template uploaded' })
  @UseInterceptors(FileInterceptor('file'))
  uploadTemplate(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UploadTemplateDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.templatesService.uploadTemplate(req.user, dto, file);
  }
}
