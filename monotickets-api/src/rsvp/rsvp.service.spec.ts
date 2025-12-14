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
});
