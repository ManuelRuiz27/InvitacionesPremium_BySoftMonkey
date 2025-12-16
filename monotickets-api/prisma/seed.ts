import { PrismaClient, UserRole, EventStatus, RsvpStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    try {
        await prisma.scan.deleteMany();
        await prisma.deliveryAttempt.deleteMany();
        await prisma.invitation.deleteMany();
        await prisma.guest.deleteMany();
        await prisma.rsvpConfig.deleteMany();
        await prisma.event.deleteMany();
        await prisma.user.deleteMany();
    } catch (e) {
        console.warn('⚠️  Some tables might be empty or issues interacting with DB during cleanup');
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create users
    console.log('👥 Creating users...');
    const director = await prisma.user.create({
        data: {
            email: 'director@monotickets.com',
            password: hashedPassword,
            fullName: 'Director Global',
            role: UserRole.DIRECTOR_GLOBAL,
        },
    });

    const planner = await prisma.user.create({
        data: {
            email: 'planner@monotickets.com',
            password: hashedPassword,
            fullName: 'Juan Planner',
            role: UserRole.PLANNER,
        },
    });

    const staff = await prisma.user.create({
        data: {
            email: 'staff@monotickets.com',
            password: hashedPassword,
            fullName: 'María Staff',
            role: UserRole.STAFF,
        },
    });

    console.log('✅ Created users:', {
        director: director.email,
        planner: planner.email,
        staff: staff.email,
    });

    // Create events
    console.log('🎉 Creating events...');

    // Event 1: PUBLISHED event happening today (for testing scanner)
    const today = new Date();
    // Normalize to CDMX largely by just assuming local time for now or UTC-6
    // We'll just use current server time as "today"

    const eventToday = await prisma.event.create({
        data: {
            name: 'Boda García - López',
            date: today, // Date of event is NOW
            location: 'Jardín Botánico CDMX',
            description: 'Ceremonia y recepción',
            plannerId: planner.id,
            status: EventStatus.PUBLISHED,
            publishedAt: new Date(),
        },
    });

    // Create RSVP config for this event
    await prisma.rsvpConfig.create({
        data: {
            eventId: eventToday.id,
            allowRsvp: true,
            rsvpDeadlineDays: 0,
            revocationWindowDays: 20,
        },
    });

    // Event 2: DRAFT event for future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const eventFuture = await prisma.event.create({
        data: {
            name: 'XV Años Sofía',
            date: futureDate,
            location: 'Salón Real',
            description: 'Celebración de XV años',
            plannerId: planner.id,
            status: EventStatus.DRAFT,
        },
    });

    // Event 3: BLOCKED event
    const eventBlocked = await prisma.event.create({
        data: {
            name: 'Evento Bloqueado (Prueba)',
            date: futureDate, // Future date
            location: 'N/A',
            plannerId: planner.id,
            status: EventStatus.BLOCKED,
            blockedAt: new Date(),
            blockedBy: director.id,
        },
    });

    console.log('✅ Created events');

    // Create guests and invitations for Event Today
    console.log('👨‍👩‍👧‍👦 Creating guests and invitations...');

    // Guest 1: Single person, CONFIRMED
    const guest1 = await prisma.guest.create({
        data: {
            fullName: 'Carlos Rodríguez',
            phone: '+525512345678',
            email: 'carlos@email.com',
            guestCount: 1,
            rsvpStatus: RsvpStatus.CONFIRMED,
            eventId: eventToday.id,
            inviteReceivedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            confirmedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        },
    });

    const invitation1 = await prisma.invitation.create({
        data: {
            guestId: guest1.id,
            eventId: eventToday.id,
            status: 'AWAITING_RSVP', // Or could be SENT if already delivered
            remainingCount: 1,
            sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
    });

    // Guest 2: Group of 4, CONFIRMED (for testing partial entry)
    const guest2 = await prisma.guest.create({
        data: {
            fullName: 'Familia Martínez',
            phone: '+525587654321',
            email: 'martinez@email.com',
            guestCount: 4,
            rsvpStatus: RsvpStatus.CONFIRMED,
            eventId: eventToday.id,
            inviteReceivedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
            confirmedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
    });

    const invitation2 = await prisma.invitation.create({
        data: {
            guestId: guest2.id,
            eventId: eventToday.id,
            status: 'ACTIVE_FOR_EVENT_DAY',
            remainingCount: 4,
            sentAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        },
    });

    // Guest 3: Single person, PENDING (not confirmed)
    const guest3 = await prisma.guest.create({
        data: {
            fullName: 'Ana López',
            phone: '+525598765432',
            email: 'ana@email.com',
            guestCount: 1,
            rsvpStatus: RsvpStatus.PENDING,
            eventId: eventToday.id,
            inviteReceivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
    });

    const invitation3 = await prisma.invitation.create({
        data: {
            guestId: guest3.id,
            eventId: eventToday.id,
            status: 'AWAITING_RSVP',
            remainingCount: 1,
            sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
    });

    // Guest 4: Group of 2, CONFIRMED, with REVOKED invitation
    const guest4 = await prisma.guest.create({
        data: {
            fullName: 'Pareja Sánchez',
            phone: '+525512349876',
            guestCount: 2,
            rsvpStatus: RsvpStatus.CONFIRMED,
            eventId: eventToday.id,
            inviteReceivedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            confirmedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
    });

    const invitation4 = await prisma.invitation.create({
        data: {
            guestId: guest4.id,
            eventId: eventToday.id,
            status: 'REVOKED',
            remainingCount: 2,
            sentAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            revokedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Revoked yesterday
        },
    });

    // Guest 5: Group of 3, CONFIRMED, already fully scanned (for DUPLICATE test)
    const guest5 = await prisma.guest.create({
        data: {
            fullName: 'Familia Torres',
            phone: '+525523456789',
            guestCount: 3,
            rsvpStatus: RsvpStatus.CONFIRMED,
            eventId: eventToday.id,
            inviteReceivedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            confirmedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        },
    });

    const invitation5 = await prisma.invitation.create({
        data: {
            guestId: guest5.id,
            eventId: eventToday.id,
            status: 'FULLY_USED',
            remainingCount: 0, // All already entered
            sentAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
    });

    // Create a scan for guest5
    await prisma.scan.create({
        data: {
            // Need a real or fake invitation linkage. The model allows invitationId
            invitationId: invitation5.id,
            eventId: eventToday.id,
            scannedBy: staff.id,
            status: 'VALID_FULL',
            enteredNames: ['Pedro Torres', 'Laura Torres', 'Sofía Torres'],
            remainingCountAfter: 0,
            scannedAt: new Date(),
        },
    });

    // Guest 6: Guests for blocked event (already exists)
    const guest6 = await prisma.guest.create({
        data: {
            fullName: 'Test Blocked',
            guestCount: 1,
            rsvpStatus: RsvpStatus.CONFIRMED,
            eventId: eventBlocked.id,
            confirmedAt: new Date(),
        },
    });

    const invitation6 = await prisma.invitation.create({
        data: {
            guestId: guest6.id,
            eventId: eventBlocked.id,
            status: 'CREATED',
            remainingCount: 1,
        },
    });

    // RSVP TEST CASES
    console.log('📅 Creating RSVP test cases...');

    // Case 1: Can Revoke (Received 10 days ago, Window is 20)
    const guestRevocable = await prisma.guest.create({
        data: {
            fullName: 'Guest Revocable',
            guestCount: 1,
            rsvpStatus: RsvpStatus.CONFIRMED,
            eventId: eventToday.id,
            inviteReceivedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            confirmedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
    });

    await prisma.invitation.create({
        data: {
            guestId: guestRevocable.id,
            eventId: eventToday.id,
            status: 'ACTIVE_FOR_EVENT_DAY',
            remainingCount: 1,
        },
    });

    // Case 2: Cannot Revoke (Received 25 days ago, Window is 20)
    const guestNonRevocable = await prisma.guest.create({
        data: {
            fullName: 'Guest Non-Revocable',
            guestCount: 1,
            rsvpStatus: RsvpStatus.CONFIRMED,
            eventId: eventToday.id,
            inviteReceivedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
            confirmedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        },
    });

    await prisma.invitation.create({
        data: {
            guestId: guestNonRevocable.id,
            eventId: eventToday.id,
            status: 'ACTIVE_FOR_EVENT_DAY',
            remainingCount: 1,
        },
    });

    // Case 3: Manual Confirmation Pending
    const guestManual = await prisma.guest.create({
        data: {
            fullName: 'Guest Manual Confirm',
            guestCount: 1,
            rsvpStatus: RsvpStatus.PENDING,
            eventId: eventToday.id,
            inviteReceivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
    });

    await prisma.invitation.create({
        data: {
            guestId: guestManual.id,
            eventId: eventToday.id,
            status: 'AWAITING_RSVP',
            remainingCount: 1,
        },
    });

    // Guests for future event
    const guest7 = await prisma.guest.create({
        data: {
            fullName: 'María Hernández',
            phone: '+525534567890',
            guestCount: 2,
            rsvpStatus: RsvpStatus.PENDING,
            eventId: eventFuture.id,
        },
    });

    const invitation7 = await prisma.invitation.create({
        data: {
            guestId: guest7.id,
            eventId: eventFuture.id,
            status: 'CREATED',
            remainingCount: 2,
        },
    });

    console.log('✅ Created guests and invitations');
    console.log('\n✅ Seed completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        try {
            await prisma.$disconnect();
        } catch (e) { }
    });
