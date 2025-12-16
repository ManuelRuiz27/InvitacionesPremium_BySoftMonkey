import { MediaService } from './media.service';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType, UserRole } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';

jest.mock('fs', () => {
  const actualFs = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actualFs,
    promises: {
      ...actualFs.promises,
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
      unlink: jest.fn().mockResolvedValue(undefined),
    },
  };
});

describe('MediaService', () => {
  let service: MediaService;
  let prisma: {
    media: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };

  const planner = { id: 'planner-1', role: UserRole.PLANNER };
  const sampleFile = {
    originalname: 'photo.png',
    mimetype: 'image/png',
    buffer: Buffer.from('fake-image'),
  };

  beforeEach(() => {
    prisma = {
      media: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new MediaService(prisma as unknown as PrismaService);
    (fs.mkdir as jest.Mock).mockClear();
    (fs.writeFile as jest.Mock).mockClear();
    (fs.unlink as jest.Mock).mockClear();
  });

  it('stores metadata in Prisma after saving file', async () => {
    const mediaRecord = {
      id: 'med-1',
      url: 'media/planner-1/123-photo.png',
    };
    prisma.media.create.mockResolvedValue(mediaRecord);

    const result = await service.uploadMedia(
      planner,
      sampleFile,
      MediaType.IMAGE,
    );

    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
    const mockCalls = prisma.media.create.mock.calls as Array<
      [{ data: { ownerPlannerId: string; type: MediaType; mime: string } }]
    >;
    const payload = mockCalls[0]?.[0];
    expect(payload).toBeDefined();
    expect(payload.data.ownerPlannerId).toBe(planner.id);
    expect(payload.data.type).toBe(MediaType.IMAGE);
    expect(payload.data.mime).toBe('image/png');
    expect(result).toEqual(mediaRecord);
  });

  it('lists media with pagination metadata', async () => {
    const items = [
      { id: 'med-1', ownerPlannerId: planner.id, mime: 'image/png' },
    ];
    prisma.media.findMany.mockResolvedValue(items);
    prisma.media.count.mockResolvedValue(1);

    const result = await service.listMedia(planner, { page: 2, limit: 10 });

    expect(prisma.media.findMany).toHaveBeenCalledWith({
      where: { ownerPlannerId: planner.id },
      orderBy: { createdAt: 'desc' },
      skip: 10,
      take: 10,
    });
    expect(result.data).toEqual(items);
    expect(result.meta.page).toBe(2);
    expect(result.meta.total).toBe(1);
  });

  it('deletes media assets when owned by planner', async () => {
    prisma.media.findUnique.mockResolvedValue({
      id: 'med-1',
      ownerPlannerId: planner.id,
      url: 'media/planner-1/asset.png',
    });

    await service.deleteMedia(planner, 'med-1');

    expect(prisma.media.delete).toHaveBeenCalledWith({
      where: { id: 'med-1' },
    });
    expect(fs.unlink).toHaveBeenCalled();
  });

  it('rejects deletion when asset does not belong to planner', async () => {
    prisma.media.findUnique.mockResolvedValue({
      id: 'med-1',
      ownerPlannerId: 'other',
      url: 'media/other/asset.png',
    });

    await expect(service.deleteMedia(planner, 'med-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects files bigger than 2MB', async () => {
    const bigFile = {
      ...sampleFile,
      buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
    };

    await expect(service.uploadMedia(planner, bigFile)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('blocks non-planner roles', async () => {
    await expect(
      service.uploadMedia(
        { id: 'director-1', role: UserRole.DIRECTOR_GLOBAL },
        sampleFile,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
