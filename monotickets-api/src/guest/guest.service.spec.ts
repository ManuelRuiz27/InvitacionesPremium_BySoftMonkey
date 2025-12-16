import { GuestService } from './guest.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GuestService', () => {
  let service: GuestService;
  let prisma: {
    invitation: { findUnique: jest.Mock };
    guest: { update: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      invitation: {
        findUnique: jest.fn(),
      },
      guest: {
        update: jest.fn(),
      },
    };
    service = new GuestService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('generates ICS with reminders in CDMX timezone', async () => {
    prisma.invitation.findUnique.mockResolvedValue({
      id: 'inv-1',
      qrToken: 'token',
      event: {
        id: 'evt-1',
        name: 'Boda Demo',
        date: new Date('2025-12-25T23:00:00.000Z'),
        location: 'CDMX',
        description: 'Celebración',
        status: 'PUBLISHED',
      },
      guest: {
        fullName: 'María',
        rsvpStatus: 'CONFIRMED',
      },
      remainingCount: 1,
    });

    const result = await service.getCalendar('token', { reminders: ['P3D'] });
    expect(result.mimeType).toBe('text/calendar');
    expect(result.content).toContain('TRIGGER:-P3D');
    expect(result.content).toContain('DTSTART;TZID=America/Mexico_City');
  });

  it('returns memory view with premium config', async () => {
    prisma.invitation.findUnique.mockResolvedValue({
      id: 'inv-2',
      qrToken: 'token',
      event: {
        id: 'evt-2',
        name: 'Fiesta',
        date: new Date(),
        location: 'CDMX',
        description: 'Descripción',
        premiumConfig: {
          effect: 'SCROLL',
          colors: {},
          sections: {
            story: { enabled: true, text: 'Historia' },
            extras: [],
          },
          reduceMotionDefault: false,
        },
      },
      guest: {
        id: 'guest-1',
        fullName: 'Juan',
        email: 'juan@example.com',
        rsvpStatus: 'CONFIRMED',
        guestCount: 2,
      },
      status: 'FULLY_USED',
      remainingCount: 0,
    });

    const memory = await service.getMemoryView('token');
    expect(memory.event.name).toBe('Fiesta');
    expect(memory.guest.fullName).toBe('Juan');
    expect(memory.premium.effect).toBe('SCROLL');
  });
});
