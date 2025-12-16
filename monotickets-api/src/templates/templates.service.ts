import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadTemplateDto } from './dto/upload-template.dto';
import { SelectTemplateDto } from './dto/select-template.dto';
import { UpdateQrPlacementDto } from './dto/update-qr-placement.dto';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { UploadedFile } from '../common/files/uploaded-file.type';
import { normalizeUploadedFile } from '../common/files/normalize-uploaded-file.util';

@Injectable()
export class TemplatesService {
  private readonly storageRoot = join(process.cwd(), 'storage');

  constructor(private prisma: PrismaService) {}

  async listPdfTemplates(category?: string) {
    return this.prisma.pdfTemplate.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadTemplate(
    user: AuthenticatedUser,
    dto: UploadTemplateDto,
    file?: unknown,
  ) {
    const uploadedFile = this.normalizeFile(file);
    const relativePath = await this.saveFile(
      'templates',
      uploadedFile.originalname,
      uploadedFile.buffer,
    );
    const isSystemTemplate = user.role !== UserRole.PLANNER;

    const template = await this.prisma.pdfTemplate.create({
      data: {
        name: dto.name,
        category: dto.category,
        pdfUrl: relativePath,
        thumbUrl: null,
        ownerPlannerId: user.role === UserRole.PLANNER ? user.id : null,
        isSystemTemplate,
      },
    });

    return template;
  }

  async selectTemplateForEvent(
    eventId: string,
    user: AuthenticatedUser,
    dto: SelectTemplateDto,
  ) {
    await this.ensureEventAccess(eventId, user);
    const template = await this.prisma.pdfTemplate.findUnique({
      where: { id: dto.templateId },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const config = await this.prisma.eventPdfConfig.upsert({
      where: { eventId },
      update: {
        templateId: dto.templateId,
        customPdfUrl: null,
      },
      create: {
        eventId,
        templateId: dto.templateId,
      },
      include: {
        template: true,
      },
    });

    return config;
  }

  async uploadCustomTemplateForEvent(
    eventId: string,
    user: AuthenticatedUser,
    file?: unknown,
  ) {
    await this.ensureEventAccess(eventId, user);
    const uploadedFile = this.normalizeFile(file);
    const relativePath = await this.saveFile(
      `events/${eventId}`,
      uploadedFile.originalname,
      uploadedFile.buffer,
    );

    return this.prisma.eventPdfConfig.upsert({
      where: { eventId },
      update: {
        customPdfUrl: relativePath,
        templateId: null,
      },
      create: {
        eventId,
        customPdfUrl: relativePath,
      },
    });
  }

  async updateQrPlacement(
    eventId: string,
    user: AuthenticatedUser,
    dto: UpdateQrPlacementDto,
  ) {
    await this.ensureEventAccess(eventId, user);
    this.validatePlacement(dto);

    return this.prisma.eventPdfConfig.upsert({
      where: { eventId },
      update: {
        qrPlacement: {
          page_index: dto.pageIndex,
          x: dto.x,
          y: dto.y,
          w: dto.w,
          h: dto.h,
          rotation: dto.rotation,
        },
      },
      create: {
        eventId,
        qrPlacement: {
          page_index: dto.pageIndex,
          x: dto.x,
          y: dto.y,
          w: dto.w,
          h: dto.h,
          rotation: dto.rotation,
        },
      },
    });
  }

  private async ensureEventAccess(eventId: string, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, plannerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!user) {
      throw new ForbiddenException('User context required');
    }

    if (user.role === UserRole.DIRECTOR_GLOBAL) {
      return event;
    }

    if (user.role === UserRole.PLANNER && event.plannerId === user.id) {
      return event;
    }

    throw new ForbiddenException(
      'You do not have permission to manage this event template',
    );
  }

  private assertPdf(file: UploadedFile) {
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }
  }

  private normalizeFile(file?: unknown): UploadedFile {
    const uploadedFile = normalizeUploadedFile(file, {
      fieldName: 'PDF',
    });
    this.assertPdf(uploadedFile);
    return uploadedFile;
  }

  private async saveFile(
    namespace: string,
    originalName: string,
    buffer: Buffer,
  ) {
    const safeName = originalName?.replace(/\s+/g, '_') || 'template.pdf';
    const timestamp = Date.now();
    const relativePath = `${namespace}/${timestamp}-${safeName}`;
    const absolutePath = join(this.storageRoot, relativePath);
    await fs.mkdir(dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);
    return relativePath.replace(/\\/g, '/');
  }

  private validatePlacement(dto: UpdateQrPlacementDto) {
    const values = [dto.x, dto.y, dto.w, dto.h];
    if (values.some((value) => value < 0 || value > 1)) {
      throw new BadRequestException('Placement values must be between 0 and 1');
    }

    const validRotations = [0, 90, 180, 270];
    if (!validRotations.includes(dto.rotation)) {
      throw new BadRequestException('Rotation must be one of 0, 90, 180, 270');
    }
  }
}
