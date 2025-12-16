import { BadRequestException } from '@nestjs/common';
import { UploadedFile } from './uploaded-file.type';

export function normalizeUploadedFile(
  file?: unknown,
  options?: { fieldName?: string },
): UploadedFile {
  if (!file || typeof file !== 'object') {
    throw new BadRequestException(
      `${options?.fieldName ?? 'File'} upload is required`,
    );
  }

  if (!isUploadedFile(file)) {
    throw new BadRequestException('Invalid uploaded file payload');
  }

  return file;
}

export function isUploadedFile(file: unknown): file is UploadedFile {
  if (!file || typeof file !== 'object') {
    return false;
  }

  const candidate = file as Partial<UploadedFile> & { buffer?: unknown };
  return (
    typeof candidate.originalname === 'string' &&
    typeof candidate.mimetype === 'string' &&
    candidate.buffer instanceof Buffer
  );
}
