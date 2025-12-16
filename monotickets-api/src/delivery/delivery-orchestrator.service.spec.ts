import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryProvider } from './providers/delivery-provider.interface';
import { InvitationStatus } from '@prisma/client';

describe('DeliveryOrchestratorService', () => {
    let service: DeliveryOrchestratorService;
    let prisma: PrismaService;
    let smsProvider: DeliveryProvider;
    let whatsappProvider: DeliveryProvider;

    const mockPrismaService = {
        invitation: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        deliveryAttempt: {
            create: jest.fn(),
        },
    };

    const mockSmsProvider: DeliveryProvider = {
        getName: () => 'TEST_SMS',
        isAvailable: () => true,
        send: jest.fn(),
    };

    const mockWhatsAppProvider: DeliveryProvider = {
        getName: () => 'TEST_WHATSAPP',
        isAvailable: () => true,
        send: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeliveryOrchestratorService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: 'SMS_PROVIDER',
                    useValue: mockSmsProvider,
                },
                {
                    provide: 'WHATSAPP_PROVIDER',
                    useValue: mockWhatsAppProvider,
                },
            ],
        }).compile();

        service = module.get<DeliveryOrchestratorService>(
            DeliveryOrchestratorService,
        );
        prisma = module.get<PrismaService>(PrismaService);
        smsProvider = mockSmsProvider;
        whatsappProvider = mockWhatsAppProvider;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendInvitation', () => {
        it('should send via both channels successfully', async () => {
            const invitationId = 'inv-123';
            const mockInvitation = {
                id: invitationId,
                qrToken: 'QR-123',
                eventId: 'event-123',
                guestId: 'guest-123',
                guest: {
                    id: 'guest-123',
                    fullName: 'Test Guest',
                    phone: '+5215512345678',
                },
                event: {
                    id: 'event-123',
                    name: 'Test Event',
                    date: new Date('2025-12-25'),
                },
            };

            mockPrismaService.invitation.findUnique.mockResolvedValue(
                mockInvitation,
            );
            mockPrismaService.invitation.update.mockResolvedValue({
                ...mockInvitation,
                status: InvitationStatus.DELIVERED,
            });
            mockPrismaService.deliveryAttempt.create.mockResolvedValue({});

            (smsProvider.send as jest.Mock).mockResolvedValue({
                success: true,
                providerId: 'SMS-123',
            });

            (whatsappProvider.send as jest.Mock).mockResolvedValue({
                success: true,
                providerId: 'WA-123',
            });

            const result = await service.sendInvitation(invitationId);

            expect(result.success).toBe(true);
            expect(result.channels).toHaveLength(2);
            expect(result.invalidNumber).toBe(false);
            expect(smsProvider.send).toHaveBeenCalled();
            expect(whatsappProvider.send).toHaveBeenCalled();
        });

        it('should retry up to 3 times on failure', async () => {
            const invitationId = 'inv-123';
            const mockInvitation = {
                id: invitationId,
                qrToken: 'QR-123',
                eventId: 'event-123',
                guestId: 'guest-123',
                guest: {
                    id: 'guest-123',
                    fullName: 'Test Guest',
                    phone: '+5215512345678',
                },
                event: {
                    id: 'event-123',
                    name: 'Test Event',
                    date: new Date('2025-12-25'),
                },
            };

            mockPrismaService.invitation.findUnique.mockResolvedValue(
                mockInvitation,
            );
            mockPrismaService.invitation.update.mockResolvedValue(mockInvitation);
            mockPrismaService.deliveryAttempt.create.mockResolvedValue({});

            // SMS fails 2 times, succeeds on 3rd
            (smsProvider.send as jest.Mock)
                .mockResolvedValueOnce({ success: false, error: 'Network error' })
                .mockResolvedValueOnce({ success: false, error: 'Network error' })
                .mockResolvedValueOnce({ success: true, providerId: 'SMS-123' });

            (whatsappProvider.send as jest.Mock).mockResolvedValue({
                success: true,
                providerId: 'WA-123',
            });

            const result = await service.sendInvitation(invitationId);

            expect(result.success).toBe(true);
            expect(smsProvider.send).toHaveBeenCalledTimes(3);
            expect(whatsappProvider.send).toHaveBeenCalledTimes(1);
        });

        it('should detect invalid number when both channels report invalid', async () => {
            const invitationId = 'inv-123';
            const mockInvitation = {
                id: invitationId,
                qrToken: 'QR-123',
                eventId: 'event-123',
                guestId: 'guest-123',
                guest: {
                    id: 'guest-123',
                    fullName: 'Test Guest',
                    phone: '+5215512345678',
                },
                event: {
                    id: 'event-123',
                    name: 'Test Event',
                    date: new Date('2025-12-25'),
                },
            };

            mockPrismaService.invitation.findUnique.mockResolvedValue(
                mockInvitation,
            );
            mockPrismaService.invitation.update.mockResolvedValue(mockInvitation);
            mockPrismaService.deliveryAttempt.create.mockResolvedValue({});

            (smsProvider.send as jest.Mock).mockResolvedValue({
                success: false,
                invalidNumber: true,
                error: 'Invalid number',
            });

            (whatsappProvider.send as jest.Mock).mockResolvedValue({
                success: false,
                invalidNumber: true,
                error: 'Number not registered',
            });

            const result = await service.sendInvitation(invitationId);

            expect(result.success).toBe(false);
            expect(result.invalidNumber).toBe(true);
        });
    });

    describe('sendBulk', () => {
        it('should send multiple invitations and return summary', async () => {
            const invitationIds = ['inv-1', 'inv-2', 'inv-3'];

            // Mock successful sends
            jest.spyOn(service, 'sendInvitation').mockResolvedValue({
                success: true,
                channels: [],
                invalidNumber: false,
            });

            const result = await service.sendBulk(invitationIds);

            expect(result.total).toBe(3);
            expect(result.successful).toBe(3);
            expect(result.failed).toBe(0);
            expect(result.invalidNumbers).toBe(0);
        });
    });
});
