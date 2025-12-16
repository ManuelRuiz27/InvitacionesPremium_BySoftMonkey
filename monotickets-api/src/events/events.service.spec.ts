import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventStatus, UserRole } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

const plannerResponse = {
  id: 'planner-1',
  email: 'planner@test.com',
  fullName: 'Planner Uno',
};

function buildEventResponse(overrides: Partial<any> = {}) {
  return {
    id: 'evt-1',
    name: 'Test Event',
    plannerId: 'planner-1',
    status: EventStatus.DRAFT,
    _count: { guests: 0, invitations: 0, scans: 0 },
    planner: plannerResponse,
    ...overrides,
  };
}

describe('EventsService - lifecycle', () => {
  let service: EventsService;
  let prisma: {
    event: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    guest: {
      count: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      event: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      guest: {
        count: jest.fn(),
      },
    };
    service = new EventsService(prisma as unknown as PrismaService);
  });

  describe('publish', () => {
    it('allows planner owner to publish a draft event', async () => {
      prisma.event.findUnique
        .mockResolvedValueOnce({
          id: 'evt-1',
          plannerId: 'planner-1',
          status: EventStatus.DRAFT,
          publishedAt: null,
        })
        .mockResolvedValueOnce(
          buildEventResponse({ status: EventStatus.PUBLISHED }),
        );

      prisma.event.update.mockResolvedValueOnce({});

      const result = await service.publish('evt-1', {
        id: 'planner-1',
        role: UserRole.PLANNER,
      });

      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: expect.objectContaining({
          status: EventStatus.PUBLISHED,
        }),
      });
      expect(result.status).toBe(EventStatus.PUBLISHED);
    });

    it('rejects publish when planner is not owner', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        plannerId: 'planner-1',
        status: EventStatus.DRAFT,
      });

      await expect(
        service.publish('evt-1', { id: 'planner-2', role: UserRole.PLANNER }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('block/unblock', () => {
    it('requires director role to block', async () => {
      await expect(
        service.block('evt-1', { id: 'planner-1', role: UserRole.PLANNER }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('restores previous status after unblocking', async () => {
      prisma.event.findUnique
        .mockResolvedValueOnce({
          id: 'evt-1',
          plannerId: 'planner-1',
          status: EventStatus.BLOCKED,
          publishedAt: new Date(),
          closedAt: null,
        })
        .mockResolvedValueOnce(
          buildEventResponse({ status: EventStatus.PUBLISHED }),
        );

      prisma.event.update.mockResolvedValue({});

      const result = await service.unblock('evt-1', {
        id: 'director-1',
        role: UserRole.DIRECTOR_GLOBAL,
      });

      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: expect.objectContaining({
          status: EventStatus.PUBLISHED,
          blockedAt: null,
          blockedBy: null,
        }),
      });
      expect(result.status).toBe(EventStatus.PUBLISHED);
    });
  });
});
