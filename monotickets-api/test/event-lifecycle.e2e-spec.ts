import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { UserRole, EventStatus } from '@prisma/client';

describe('Event Lifecycle (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authToken: string;
    let plannerId: string;
    let eventId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // Clean database
        await prisma.scan.deleteMany();
        await prisma.deliveryAttempt.deleteMany();
        await prisma.invitation.deleteMany();
        await prisma.guest.deleteMany();
        await prisma.event.deleteMany();
        await prisma.user.deleteMany();

        // Create test planner
        const planner = await prisma.user.create({
            data: {
                email: 'planner@test.com',
                fullName: 'Test Planner',
                password: 'hashedpassword',
                role: UserRole.PLANNER,
            },
        });
        plannerId = planner.id;

        // Login to get token (simplified - in real app would use proper auth)
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'planner@test.com',
                password: 'password123',
            });

        authToken = loginResponse.body.access_token || 'mock-token';
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });

    describe('Complete Event Flow', () => {
        it('should create event in DRAFT status', async () => {
            const response = await request(app.getHttpServer())
                .post('/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'E2E Test Event',
                    date: new Date('2025-12-25').toISOString(),
                    location: 'Test Venue',
                    description: 'E2E Test Description',
                    plannerId,
                })
                .expect(201);

            expect(response.body.status).toBe(EventStatus.DRAFT);
            expect(response.body.name).toBe('E2E Test Event');
            eventId = response.body.id;
        });

        it('should publish event successfully', async () => {
            const response = await request(app.getHttpServer())
                .post(`/events/${eventId}/publish`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.status).toBe(EventStatus.PUBLISHED);
            expect(response.body.publishedAt).toBeDefined();
        });

        it('should reject publishing more than 5 events', async () => {
            // Create and publish 4 more events (total 5)
            for (let i = 0; i < 4; i++) {
                const event = await prisma.event.create({
                    data: {
                        name: `Event ${i + 2}`,
                        date: new Date('2025-12-25'),
                        plannerId,
                        status: EventStatus.DRAFT,
                    },
                });

                await request(app.getHttpServer())
                    .post(`/events/${event.id}/publish`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
            }

            // Try to create and publish 6th event
            const sixthEvent = await prisma.event.create({
                data: {
                    name: 'Sixth Event',
                    date: new Date('2025-12-25'),
                    plannerId,
                    status: EventStatus.DRAFT,
                },
            });

            await request(app.getHttpServer())
                .post(`/events/${sixthEvent.id}/publish`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });

        it('should close event successfully', async () => {
            const response = await request(app.getHttpServer())
                .post(`/events/${eventId}/close`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.status).toBe(EventStatus.CLOSED);
            expect(response.body.closedAt).toBeDefined();
        });

        it('should reject closing already closed event', async () => {
            await request(app.getHttpServer())
                .post(`/events/${eventId}/close`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
    });
});
