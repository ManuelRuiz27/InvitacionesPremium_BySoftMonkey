import { DeliveryRetryService } from './delivery-retry.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryService } from '../delivery/delivery.service';
import { DeliveryStatus, InvitationStatus } from '@prisma/client';

const buildInvitation = (overrides: Partial<any> = {}) => ({
  id: 'inv-1',
  status: InvitationStatus.AWAITING_RSVP,
  deliveryAttempts: [
    {
      id: 'att-1',
      status: DeliveryStatus.FAILED,
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
    },
  ],
  ...overrides,
});

describe('DeliveryRetryService', () => {
  let service: DeliveryRetryService;
  let prisma: { invitation: { findMany: jest.Mock } };
  let delivery: { sendInvitation: jest.Mock };

  beforeEach(() => {
    prisma = {
      invitation: {
        findMany: jest.fn(),
      },
    };

    delivery = {
      sendInvitation: jest.fn().mockResolvedValue({ message: 'ok' }),
    };

    service = new DeliveryRetryService(
      prisma as unknown as PrismaService,
      delivery as unknown as DeliveryService,
    );
  });

  it('retries invitations without successful attempts and under max tries', async () => {
    prisma.invitation.findMany.mockResolvedValue([
      buildInvitation(),
      buildInvitation({
        id: 'inv-2',
        deliveryAttempts: [
          {
            status: DeliveryStatus.FAILED,
            createdAt: new Date(Date.now() - 10 * 60 * 1000),
          },
          {
            status: DeliveryStatus.DELIVERED,
            createdAt: new Date(Date.now() - 5 * 60 * 1000),
          },
        ],
      }),
    ]);

    const result = await service.retryFailedDeliveries();

    expect(delivery.sendInvitation).toHaveBeenCalledTimes(1);
    expect(delivery.sendInvitation).toHaveBeenCalledWith('inv-1');
    expect(result.retried).toBe(1);
  });
});
