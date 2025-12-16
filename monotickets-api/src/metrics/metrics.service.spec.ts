import { MetricsService } from './metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('MetricsService', () => {
  let service: MetricsService;
  let prisma: {
    event: { findUnique: jest.Mock; findMany: jest.Mock };
    scan: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      event: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      scan: {
        findMany: jest.fn(),
      },
    };
    service = new MetricsService(prisma as unknown as PrismaService);
  });

  it('returns event metrics for owner planner', async () => {
    const now = new Date();
    prisma.event.findUnique.mockResolvedValue({
      id: 'evt-1',
      plannerId: 'planner-1',
      guests: [
        {
          id: 'g1',
          guestCount: 1,
          rsvpStatus: 'CONFIRMED',
          inviteReceivedAt: now,
          confirmedAt: now,
          declinedAt: null,
        },
      ],
      invitations: [{ status: 'DELIVERED' }],
    });
    prisma.scan.findMany.mockResolvedValue([
      { enteredNames: ['Invitado Uno'] },
    ]);

    const result = await service.getEventMetrics('evt-1', {
      id: 'planner-1',
      role: UserRole.PLANNER,
    });
    expect(result.deliveryRate).toBe(100);
    expect(result.showUpRate).toBe(100);
  });

  it('blocks unauthorized planner for event metrics', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'evt-1',
      plannerId: 'planner-1',
      guests: [],
      invitations: [],
    });

    await expect(
      service.getEventMetrics('evt-1', {
        id: 'planner-2',
        role: UserRole.PLANNER,
      }),
    ).rejects.toThrow('You do not have permission to view these metrics');
  });

  it('returns aggregated metrics only for director global', async () => {
    const now = new Date();
    prisma.event.findMany.mockResolvedValue([
      {
        id: 'evt-1',
        plannerId: 'planner-1',
        guests: [
          {
            id: 'g1',
            guestCount: 1,
            rsvpStatus: 'CONFIRMED',
            inviteReceivedAt: now,
            confirmedAt: now,
            declinedAt: null,
          },
        ],
        invitations: [{ status: 'DELIVERED' }],
      },
    ]);
    prisma.scan.findMany.mockResolvedValue([
      { enteredNames: ['Invitado Uno'] },
    ]);

    const result = await service.getGlobalMetrics({
      id: 'director-1',
      role: UserRole.DIRECTOR_GLOBAL,
    });
    expect(result.totalEvents).toBe(1);
    expect(result.deliveryRate).toBe(100);
  });

  it('prevents non directors from reading global metrics', async () => {
    await expect(
      service.getGlobalMetrics({ id: 'planner-1', role: UserRole.PLANNER }),
    ).rejects.toThrow('Only Director Global can view global metrics');
  });
});
