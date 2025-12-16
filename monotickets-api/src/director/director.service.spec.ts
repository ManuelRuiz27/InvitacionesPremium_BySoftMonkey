import { DirectorService } from './director.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryStatus, EventStatus } from '@prisma/client';

describe('DirectorService alerts', () => {
  let service: DirectorService;
  let prisma: {
    event: { findMany: jest.Mock };
    user: { update: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      event: { findMany: jest.fn() },
      user: { update: jest.fn() },
    };
    service = new DirectorService(prisma as unknown as PrismaService);
  });

  it('returns delivery alerts when failed rate exceeds threshold', async () => {
    prisma.event.findMany.mockResolvedValue([
      {
        id: 'evt-1',
        name: 'Evento',
        status: EventStatus.PUBLISHED,
        blockedAt: null,
        planner: {
          id: 'planner-1',
          fullName: 'Planner Uno',
          email: 'p1@example.com',
        },
        invitations: [
          {
            id: 'inv-1',
            deliveryAttempts: [
              { status: DeliveryStatus.FAILED },
              { status: DeliveryStatus.SENT },
            ],
          },
        ],
      },
    ]);

    const alerts = await service.getAlerts(0.1);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('DELIVERY_FAILURE');
  });

  it('creates blocked event alert', async () => {
    prisma.event.findMany.mockResolvedValue([
      {
        id: 'evt-2',
        name: 'Evento Bloqueado',
        status: EventStatus.BLOCKED,
        blockedAt: new Date('2025-01-01T00:00:00Z'),
        planner: {
          id: 'planner-1',
          fullName: 'Planner Uno',
          email: 'p1@example.com',
        },
        invitations: [],
      },
    ]);

    const alerts = await service.getAlerts();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('EVENT_BLOCKED');
  });
});
