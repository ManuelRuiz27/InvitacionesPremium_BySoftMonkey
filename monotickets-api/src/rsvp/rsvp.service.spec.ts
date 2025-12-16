import { RsvpService } from './rsvp.service';
import { PrismaService } from '../prisma/prisma.service';
import { RsvpConfigService } from './rsvp-config.service';
import { UserRole } from '@prisma/client';

describe('RsvpService - config access', () => {
  let service: RsvpService;
  let prisma: {
    event: { findUnique: jest.Mock };
    guest: { findUnique: jest.Mock; update: jest.Mock; findMany: jest.Mock };
  };
  let configService: {
    getOrCreateConfig: jest.Mock;
    updateConfig: jest.Mock;
    canRevoke: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      event: { findUnique: jest.fn() },
      guest: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    configService = {
      getOrCreateConfig: jest.fn(),
      updateConfig: jest.fn(),
      canRevoke: jest.fn(),
    };

    service = new RsvpService(
      prisma as unknown as PrismaService,
      configService as unknown as RsvpConfigService,
    );
  });

  it('returns config for planner owner', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'evt-1',
      plannerId: 'planner-1',
    });
    configService.getOrCreateConfig.mockResolvedValue({
      eventId: 'evt-1',
      allowRsvp: true,
      rsvpDeadlineDays: 0,
      revocationWindowDays: 20,
    });

    const config = await service.getConfig('evt-1', {
      id: 'planner-1',
      role: UserRole.PLANNER,
    });
    expect(configService.getOrCreateConfig).toHaveBeenCalledWith('evt-1');
    expect(config.allowRsvp).toBe(true);
  });

  it('prevents non-owner planner from updating config', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'evt-1',
      plannerId: 'planner-1',
    });

    await expect(
      service.createConfig(
        'evt-1',
        { id: 'planner-2', role: UserRole.PLANNER },
        { allowRsvp: false },
      ),
    ).rejects.toThrow(
      'You do not have permission to manage this RSVP configuration',
    );
  });
});
