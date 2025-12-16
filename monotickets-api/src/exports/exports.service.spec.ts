import { ExportsService } from './exports.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('ExportsService', () => {
  let service: ExportsService;
  let prisma: {
    event: { findUnique: jest.Mock };
    guest: { findMany: jest.Mock };
    scan: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      event: { findUnique: jest.fn() },
      guest: { findMany: jest.fn() },
      scan: { findMany: jest.fn() },
    };
    service = new ExportsService(prisma as unknown as PrismaService);
  });

  it('generates guest CSV when planner owns the event', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'evt-1',
      name: 'Gran Evento',
      plannerId: 'planner-1',
    });
    prisma.guest.findMany.mockResolvedValue([
      {
        fullName: 'Invitado Uno',
        phone: '+521234567890',
        email: 'guest@example.com',
        guestCount: 1,
        rsvpStatus: 'CONFIRMED',
        inviteReceivedAt: new Date(),
        confirmedAt: new Date(),
        declinedAt: null,
      },
    ]);

    const result = await service.exportGuests(
      'evt-1',
      { id: 'planner-1', role: UserRole.PLANNER },
      'csv',
    );
    expect(result.filename).toBe('guests-gran_evento.csv');
    expect(result.content).toContain('Invitado Uno');
    expect(result.contentType).toBe('text/csv');
  });

  it('generates guest Excel when requested', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'evt-1',
      name: 'Gran Evento',
      plannerId: 'planner-1',
    });
    prisma.guest.findMany.mockResolvedValue([
      {
        fullName: 'Invitado Uno',
        phone: '+521234567890',
        email: 'guest@example.com',
        guestCount: 1,
        rsvpStatus: 'CONFIRMED',
        inviteReceivedAt: new Date(),
        confirmedAt: new Date(),
        declinedAt: null,
      },
    ]);

    const result = await service.exportGuests(
      'evt-1',
      { id: 'planner-1', role: UserRole.PLANNER },
      'xlsx',
    );
    expect(result.filename).toBe('guests-gran_evento.xlsx');
    expect(Buffer.isBuffer(result.content)).toBe(true);
    expect(result.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('prevents planners from exporting events they do not own', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'evt-1',
      name: 'Gran Evento',
      plannerId: 'planner-1',
    });

    await expect(
      service.exportGuests('evt-1', {
        id: 'planner-2',
        role: UserRole.PLANNER,
      }),
    ).rejects.toThrow('You do not have permission to export this event');
  });
});
