import { InvitationsService } from './invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryService } from '../delivery/delivery.service';
import { InvitationStatus } from '@prisma/client';

describe('InvitationsService - send', () => {
  let service: InvitationsService;
  let prisma: any;
  let delivery: { sendBulk: jest.Mock };

  beforeEach(() => {
    prisma = {
      invitation: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (operations: Array<Promise<any>>) =>
        Promise.all(operations),
      ),
    };

    delivery = {
      sendBulk: jest.fn().mockResolvedValue({
        total: 1,
        successful: 1,
        failed: 0,
        errors: [],
      }),
    };

    service = new InvitationsService(
      prisma as unknown as PrismaService,
      delivery as unknown as DeliveryService,
    );
  });

  it('updates invitation statuses and triggers delivery attempts', async () => {
    prisma.invitation.findMany.mockResolvedValue([
      {
        id: 'inv-1',
        guest: { fullName: 'Guest Uno' },
        event: { id: 'evt-1', name: 'Evento' },
      },
    ]);

    prisma.invitation.update.mockImplementation(async ({ where, data }) => ({
      id: where.id,
      status: data.status,
      sentAt: data.sentAt,
      guest: { fullName: 'Guest Uno' },
      eventId: 'evt-1',
    }));

    const result = await service.send({ invitationIds: ['inv-1'] });

    expect(prisma.invitation.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['inv-1'] } },
      include: { guest: true, event: true },
    });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(delivery.sendBulk).toHaveBeenCalledWith({
      invitationIds: ['inv-1'],
    });
    expect(result.invitations[0].status).toBe(InvitationStatus.AWAITING_RSVP);
    expect(result.delivery.successful).toBe(1);
  });
});
