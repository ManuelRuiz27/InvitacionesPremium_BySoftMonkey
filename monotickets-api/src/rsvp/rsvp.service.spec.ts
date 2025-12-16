<<<<<<< HEAD
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
=======
import { Test, TestingModule } from '@nestjs/testing';
import { RsvpService } from './rsvp.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { RsvpStatus } from '@prisma/client';

describe('RsvpService', () => {
    let service: RsvpService;
    let prisma: PrismaService;

    const mockPrismaService = {
        guest: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RsvpService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<RsvpService>(RsvpService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('updateRsvp', () => {
        it('should update RSVP from PENDING to CONFIRMED', async () => {
            const guestId = 'guest-123';
            const mockGuest = {
                id: guestId,
                rsvpStatus: RsvpStatus.PENDING,
                respondedAt: null,
                invitations: [
                    {
                        id: 'inv-123',
                        receivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                    },
                ],
            };

            mockPrismaService.guest.findUnique.mockResolvedValue(mockGuest);
            mockPrismaService.guest.update.mockResolvedValue({
                ...mockGuest,
                rsvpStatus: RsvpStatus.CONFIRMED,
                respondedAt: new Date(),
            });

            const result = await service.updateRsvp(guestId, RsvpStatus.CONFIRMED);

            expect(result.rsvpStatus).toBe(RsvpStatus.CONFIRMED);
            expect(prisma.guest.update).toHaveBeenCalled();
        });

        it('should allow revocation within 20 days', async () => {
            const guestId = 'guest-123';
            const mockGuest = {
                id: guestId,
                rsvpStatus: RsvpStatus.CONFIRMED,
                respondedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                invitations: [
                    {
                        id: 'inv-123',
                        receivedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                    },
                ],
            };

            mockPrismaService.guest.findUnique.mockResolvedValue(mockGuest);
            mockPrismaService.guest.update.mockResolvedValue({
                ...mockGuest,
                rsvpStatus: RsvpStatus.DECLINED,
            });

            const result = await service.updateRsvp(guestId, RsvpStatus.DECLINED);

            expect(result.rsvpStatus).toBe(RsvpStatus.DECLINED);
        });

        it('should throw error when revoking after 20 days', async () => {
            const guestId = 'guest-123';
            const mockGuest = {
                id: guestId,
                rsvpStatus: RsvpStatus.CONFIRMED,
                respondedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
                invitations: [
                    {
                        id: 'inv-123',
                        receivedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
                    },
                ],
            };

            mockPrismaService.guest.findUnique.mockResolvedValue(mockGuest);

            await expect(
                service.updateRsvp(guestId, RsvpStatus.DECLINED),
            ).rejects.toThrow(BadRequestException);
            await expect(
                service.updateRsvp(guestId, RsvpStatus.DECLINED),
            ).rejects.toThrow(/Cannot change RSVP after 20 days/);
        });

        it('should allow planner override after 20 days', async () => {
            const guestId = 'guest-123';
            const mockGuest = {
                id: guestId,
                rsvpStatus: RsvpStatus.CONFIRMED,
                respondedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
                invitations: [
                    {
                        id: 'inv-123',
                        receivedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
                    },
                ],
            };

            mockPrismaService.guest.findUnique.mockResolvedValue(mockGuest);
            mockPrismaService.guest.update.mockResolvedValue({
                ...mockGuest,
                rsvpStatus: RsvpStatus.DECLINED,
            });

            // With planner override
            const result = await service.updateRsvp(
                guestId,
                RsvpStatus.DECLINED,
                true, // isPlannerOverride
            );

            expect(result.rsvpStatus).toBe(RsvpStatus.DECLINED);
        });
    });

    describe('getRsvpRevocationStatus', () => {
        it('should return correct revocation status within window', async () => {
            const guestId = 'guest-123';
            const receivedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

            const mockGuest = {
                id: guestId,
                rsvpStatus: RsvpStatus.CONFIRMED,
                respondedAt: new Date(),
                invitations: [
                    {
                        id: 'inv-123',
                        receivedAt,
                    },
                ],
            };

            mockPrismaService.guest.findUnique.mockResolvedValue(mockGuest);

            const result = await service.getRsvpRevocationStatus(guestId);

            expect(result.canRevoke).toBe(true);
            expect(result.daysRemaining).toBeGreaterThan(0);
            expect(result.daysRemaining).toBeLessThanOrEqual(10);
        });

        it('should return cannot revoke after 20 days', async () => {
            const guestId = 'guest-123';
            const receivedAt = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000); // 25 days ago

            const mockGuest = {
                id: guestId,
                rsvpStatus: RsvpStatus.CONFIRMED,
                respondedAt: new Date(),
                invitations: [
                    {
                        id: 'inv-123',
                        receivedAt,
                    },
                ],
            };

            mockPrismaService.guest.findUnique.mockResolvedValue(mockGuest);

            const result = await service.getRsvpRevocationStatus(guestId);

            expect(result.canRevoke).toBe(false);
            expect(result.daysRemaining).toBe(0);
        });
    });
>>>>>>> ff183bdbed4957932f8d0fec1d925d02cf1e8910
});
