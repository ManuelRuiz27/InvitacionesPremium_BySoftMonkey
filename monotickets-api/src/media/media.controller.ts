import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MediaService } from './media.service';
import { AuthenticatedRequest } from '../auth/types/authenticated-user.interface';
import { MediaType, UserRole } from '@prisma/client';
import type { Express } from 'express';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'List planner media assets' })
  @ApiResponse({ status: 200, description: 'Media assets retrieved' })
  list(@Req() req: AuthenticatedRequest, @Query() pagination: PaginationDto) {
    return this.mediaService.listMedia(req.user, pagination);
  }

  @Post('upload')
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Upload planner media asset' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', enum: Object.values(MediaType) },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Media asset stored' })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
    @Body('type') type?: MediaType,
  ) {
    return this.mediaService.uploadMedia(req.user, file, type);
  }

  @Delete(':mediaId')
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Delete a media asset' })
  @ApiResponse({ status: 200, description: 'Media asset deleted' })
  remove(@Req() req: AuthenticatedRequest, @Param('mediaId') mediaId: string) {
    return this.mediaService.deleteMedia(req.user, mediaId);
  }
}
