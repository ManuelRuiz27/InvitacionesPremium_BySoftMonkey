import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';

describe('EventsService', () => {
    let service: EventsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        event: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<EventsService>(EventsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create event in DRAFT status', async () => {
            const createDto = {
                name: 'Test Event',
                date: new Date('2025-12-25'),
                location: 'Test Location',
                description: 'Test Description',
                plannerId: 'planner-123',
            };

            const mockEvent = {
                id: 'event-123',
                ...createDto,
                status: EventStatus.DRAFT,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.event.create.mockResolvedValue(mockEvent);

            const result = await service.create(createDto);

            expect(result.status).toBe(EventStatus.DRAFT);
            expect(prisma.event.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: createDto.name,
                        plannerId: createDto.plannerId,
                    }),
                }),
            );
        });
    });

    describe('publish', () => {
        it('should publish event when conditions are met', async () => {
            const eventId = 'event-123';
            const userId = 'planner-123';

            const mockEvent = {
                id: eventId,
                name: 'Test Event',
                date: new Date('2025-12-25'),
                status: EventStatus.DRAFT,
                plannerId: userId,
                planner: { id: userId, email: 'test@test.com', fullName: 'Test User' },
                _count: { guests: 0, invitations: 0, scans: 0 },
            };

            mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
            mockPrismaService.event.count.mockResolvedValue(2); // 2 published events
            mockPrismaService.event.update.mockResolvedValue({
                ...mockEvent,
                status: EventStatus.PUBLISHED,
                publishedAt: new Date(),
            });

            const result = await service.publish(eventId, userId);

            expect(result.status).toBe(EventStatus.PUBLISHED);
            expect(result.publishedAt).toBeDefined();
        });

        it('should throw error if event is not in DRAFT status', async () => {
            const eventId = 'event-123';
            const userId = 'planner-123';

            const mockEvent = {
                id: eventId,
                status: EventStatus.PUBLISHED,
                name: 'Test Event',
                date: new Date(),
                plannerId: userId,
                planner: { id: userId, email: 'test@test.com', fullName: 'Test User' },
                _count: { guests: 0, invitations: 0, scans: 0 },
            };

            mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

            await expect(service.publish(eventId, userId)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw error if max 5 events limit reached', async () => {
            const eventId = 'event-123';
            const userId = 'planner-123';

            const mockEvent = {
                id: eventId,
                name: 'Test Event',
                date: new Date('2025-12-25'),
                status: EventStatus.DRAFT,
                plannerId: userId,
                planner: { id: userId, email: 'test@test.com', fullName: 'Test User' },
                _count: { guests: 0, invitations: 0, scans: 0 },
            };

            mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
            mockPrismaService.event.count.mockResolvedValue(5); // Already 5 published events

            await expect(service.publish(eventId, userId)).rejects.toThrow(
                BadRequestException,
            );
            await expect(service.publish(eventId, userId)).rejects.toThrow(
                /Maximum of 5 simultaneous published events/,
            );
        });
    });

    describe('close', () => {
        it('should close event successfully', async () => {
            const eventId = 'event-123';
            const userId = 'planner-123';

            const mockEvent = {
                id: eventId,
                status: EventStatus.PUBLISHED,
                plannerId: userId,
                planner: { id: userId, email: 'test@test.com', fullName: 'Test User' },
                _count: { guests: 0, invitations: 0, scans: 0 },
            };

            mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
            mockPrismaService.event.update.mockResolvedValue({
                ...mockEvent,
                status: EventStatus.CLOSED,
                closedAt: new Date(),
            });

            const result = await service.close(eventId, userId);

            expect(result.status).toBe(EventStatus.CLOSED);
            expect(result.closedAt).toBeDefined();
        });

        it('should throw error if event is already closed', async () => {
            const eventId = 'event-123';
            const userId = 'planner-123';

            const mockEvent = {
                id: eventId,
                status: EventStatus.CLOSED,
                plannerId: userId,
                planner: { id: userId, email: 'test@test.com', fullName: 'Test User' },
                _count: { guests: 0, invitations: 0, scans: 0 },
            };

            mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

            await expect(service.close(eventId, userId)).rejects.toThrow(
                BadRequestException,
            );
            await expect(service.close(eventId, userId)).rejects.toThrow(
                /already closed/,
            );
        });
    });
});
