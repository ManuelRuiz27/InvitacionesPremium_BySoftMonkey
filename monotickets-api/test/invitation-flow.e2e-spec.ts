import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { UserRole, EventStatus, RsvpStatus } from '@prisma/client';

describe('Complete Invitation Flow (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authToken: string;
    let plannerId: string;
    let eventId: string;
    let guestIds: string[] = [];
    let invitationIds: string[] = [];

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

        // Create and publish event
        const event = await prisma.event.create({
            data: {
                name: 'E2E Invitation Test Event',
                date: new Date('2025-12-25'),
                plannerId,
                status: EventStatus.PUBLISHED,
                publishedAt: new Date(),
            },
        });
        eventId = event.id;

        authToken = 'mock-token';
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });

    describe('Guest Import → Invitation → Delivery → RSVP → QR → Scan Flow', () => {
        it('should import guests from CSV', async () => {
            // Create CSV content
            const csvContent =
                'fullName,phone,email,guestCount\n' +
                'Juan Pérez,5512345678,juan@test.com,2\n' +
                'María García,5587654321,maria@test.com,3\n' +
                'Pedro López,5598765432,pedro@test.com,1\n';

            const response = await request(app.getHttpServer())
                .post(`/events/${eventId}/guests/import`)
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'guests.csv')
                .expect(201);

            expect(response.body.created).toBe(3);
            expect(response.body.summary.successRate).toBe(100);

            // Get created guests
            const guests = await prisma.guest.findMany({
                where: { eventId },
            });
            guestIds = guests.map(g => g.id);
            expect(guests).toHaveLength(3);
        });

        it('should generate invitations for all guests', async () => {
            const response = await request(app.getHttpServer())
                .post(`/events/${eventId}/invitations/generate`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    guestIds,
                })
                .expect(201);

            expect(response.body.count).toBe(3);
            expect(response.body.invitations).toHaveLength(3);

            // Verify remainingCount initialized
            const invitations = await prisma.invitation.findMany({
                where: { eventId },
                include: { guest: true },
            });

            invitationIds = invitations.map(i => i.id);

            invitations.forEach(inv => {
                expect(inv.remainingCount).toBe(inv.guest.guestCount);
            });
        });

        it('should send invitations via dual-channel', async () => {
            const response = await request(app.getHttpServer())
                .post(`/events/${eventId}/invitations/send-bulk`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    invitationIds,
                })
                .expect(200);

            expect(response.body.total).toBe(3);
            expect(response.body.successful).toBeGreaterThan(0);

            // Verify delivery attempts logged
            const attempts = await prisma.deliveryAttempt.findMany({
                where: {
                    invitationId: { in: invitationIds },
                },
            });

            expect(attempts.length).toBeGreaterThan(0);
        });

        it('should update RSVP status', async () => {
            const guest = await prisma.guest.findFirst({
                where: { eventId },
            });

            const response = await request(app.getHttpServer())
                .post(`/rsvp/${guest.id}`)
                .send({
                    status: RsvpStatus.CONFIRMED,
                })
                .expect(200);

            expect(response.body.rsvpStatus).toBe(RsvpStatus.CONFIRMED);
            expect(response.body.respondedAt).toBeDefined();
        });

        it('should generate QR code for confirmed guest', async () => {
            const invitation = await prisma.invitation.findFirst({
                where: { eventId },
                include: { guest: true },
            });

            // Update guest to confirmed
            await prisma.guest.update({
                where: { id: invitation.guestId },
                data: { rsvpStatus: RsvpStatus.CONFIRMED },
            });

            const response = await request(app.getHttpServer())
                .get(`/public/invitations/${invitation.qrToken}/qr`)
                .expect(200);

            expect(response.body.qrToken).toBeDefined();
            expect(response.body.valid).toBe(true);
        });

        it('should scan QR and track partial entry', async () => {
            const invitation = await prisma.invitation.findFirst({
                where: { eventId },
                include: { guest: true },
            });

            // Ensure guest is confirmed
            await prisma.guest.update({
                where: { id: invitation.guestId },
                data: { rsvpStatus: RsvpStatus.CONFIRMED },
            });

            // Generate QR token
            const qrResponse = await request(app.getHttpServer())
                .get(`/public/invitations/${invitation.qrToken}/qr`)
                .expect(200);

            const qrToken = qrResponse.body.qrToken;

            // Scan with partial entry (1 person from guestCount)
            const scanResponse = await request(app.getHttpServer())
                .post('/scanner/scan')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    qrToken,
                    eventId,
                    scannedBy: plannerId,
                    scannedAt: new Date().toISOString(),
                    entryCount: 1,
                })
                .expect(200);

            expect(scanResponse.body.valid).toBe(true);
            expect(scanResponse.body.guest.remainingCount).toBe(
                invitation.guest.guestCount - 1,
            );

            // Verify remainingCount updated in database
            const updatedInvitation = await prisma.invitation.findUnique({
                where: { id: invitation.id },
            });

            expect(updatedInvitation.remainingCount).toBe(
                invitation.guest.guestCount - 1,
            );
        });
    });
});
