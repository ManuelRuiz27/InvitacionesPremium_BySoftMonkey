import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { normalizeUploadedFile } from '../common/files/normalize-uploaded-file.util';
import { UploadedFile } from '../common/files/uploaded-file.type';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import {
  createPaginatedResponse,
  PaginationDto,
} from '../common/dto/pagination.dto';

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

@Injectable()
export class MediaService {
  private readonly storageRoot = join(process.cwd(), 'storage');

  constructor(private readonly prisma: PrismaService) {}

  async listMedia(user: AuthenticatedUser, pagination: PaginationDto) {
    this.ensurePlanner(user);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 50;
    const where = { ownerPlannerId: user.id };
    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.media.count({ where }),
    ]);

    return createPaginatedResponse(items, total, page, limit);
  }

  async uploadMedia(
    user: AuthenticatedUser,
    file?: unknown,
    type: MediaType = MediaType.IMAGE,
  ) {
    this.ensurePlanner(user);
    this.ensureTypeSupported(type);
    const uploadedFile = normalizeUploadedFile(file, {
      fieldName: 'Media',
    });
    this.ensureAllowedMime(uploadedFile);
    this.ensureFileSize(uploadedFile);

    const relativePath = await this.saveFile(
      this.buildNamespace(user),
      uploadedFile.originalname,
      uploadedFile.buffer,
    );

    return this.prisma.media.create({
      data: {
        ownerPlannerId: user.id,
        type,
        url: relativePath,
        sizeBytes: uploadedFile.buffer.length,
        mime: uploadedFile.mimetype,
      },
    });
  }

  async deleteMedia(user: AuthenticatedUser, mediaId: string) {
    this.ensurePlanner(user);
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media || media.ownerPlannerId !== user.id) {
      throw new NotFoundException('Media asset not found');
    }

    await this.prisma.media.delete({
      where: { id: mediaId },
    });
    await this.deleteFile(media.url);

    return { success: true };
  }

  private ensurePlanner(user: AuthenticatedUser) {
    if (!user || user.role !== UserRole.PLANNER) {
      throw new ForbiddenException('Only planners can manage media assets');
    }
  }

  private ensureAllowedMime(file: UploadedFile) {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Only PNG, JPEG or WEBP images are supported',
      );
    }
  }

  private ensureFileSize(file: UploadedFile) {
    if (file.buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException('Image exceeds the 2MB limit');
    }
  }

  private ensureTypeSupported(type: MediaType) {
    if (type !== MediaType.IMAGE) {
      throw new BadRequestException('Only image uploads are supported');
    }
  }

  private buildNamespace(user: AuthenticatedUser) {
    return `media/${user.id}`;
  }

  private async saveFile(
    namespace: string,
    originalName: string,
    buffer: Buffer,
  ) {
    const safeName =
      originalName?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '') ||
      'asset.bin';
    const timestamp = Date.now();
    const relativePath = `${namespace}/${timestamp}-${safeName}`;
    const absolutePath = join(this.storageRoot, relativePath);
    await fs.mkdir(dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);
    return relativePath.replace(/\\/g, '/');
  }

  private async deleteFile(relativePath?: string | null) {
    if (!relativePath) {
      return;
    }

    const absolutePath = join(this.storageRoot, relativePath);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
