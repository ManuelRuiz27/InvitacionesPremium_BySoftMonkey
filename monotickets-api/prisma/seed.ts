import { PrismaClient, UserRole, RsvpStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.scan.deleteMany();
    await prisma.deliveryAttempt.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.guest.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    // Hash password for all test users
    const hashedPassword = await bcrypt.hash('Test123!', 10);

    // Create users
    console.log('👥 Creating users...');

    const director = await prisma.user.create({
        data: {
            email: 'director@test.com',
            password: hashedPassword,
            fullName: 'Director Global',
            role: UserRole.DIRECTOR_GLOBAL,
        },
    });

    const planner1 = await prisma.user.create({
        data: {
            email: 'planner1@test.com',
            password: hashedPassword,
            fullName: 'María García - Planner',
            role: UserRole.PLANNER,
        },
    });

    const planner2 = await prisma.user.create({
        data: {
            email: 'planner2@test.com',
            password: hashedPassword,
            fullName: 'Carlos Rodríguez - Planner',
            role: UserRole.PLANNER,
        },
    });

    const staff1 = await prisma.user.create({
        data: {
            email: 'staff1@test.com',
            password: hashedPassword,
            fullName: 'Ana López - Staff',
            role: UserRole.STAFF,
        },
    });

    const staff2 = await prisma.user.create({
        data: {
            email: 'staff2@test.com',
            password: hashedPassword,
            fullName: 'Juan Martínez - Staff',
            role: UserRole.STAFF,
        },
    });

    console.log('✅ Created 5 users');

    // Create events
    console.log('📅 Creating events...');

    const event1 = await prisma.event.create({
        data: {
            name: 'Boda de Sofía y Miguel',
            date: new Date('2024-12-20T18:00:00'),
            location: 'Jardín Botánico, Ciudad de México',
            description: 'Celebración de boda con recepción y cena',
            plannerId: planner1.id,
        },
    });

    const event2 = await prisma.event.create({
        data: {
            name: 'XV Años de Valentina',
            date: new Date('2024-12-28T19:00:00'),
            location: 'Salón de Eventos Las Rosas, Guadalajara',
            description: 'Fiesta de quince años con vals y cena',
            plannerId: planner1.id,
        },
    });

    const event3 = await prisma.event.create({
        data: {
            name: 'Conferencia Tech Summit 2024',
            date: new Date('2025-01-15T09:00:00'),
            location: 'Centro de Convenciones, Monterrey',
            description: 'Conferencia anual de tecnología',
            plannerId: planner2.id,
        },
    });

    console.log('✅ Created 3 events');

    // Create guests and invitations for Event 1 (Boda)
    console.log('👨‍👩‍👧‍👦 Creating guests and invitations...');

    const guests1 = [
        { fullName: 'Roberto y Laura Fernández', phone: '+525512345678', email: 'roberto.fernandez@email.com', guestCount: 2, rsvpStatus: RsvpStatus.CONFIRMED },
        { fullName: 'Patricia Morales', phone: '+525587654321', email: 'patricia.morales@email.com', guestCount: 1, rsvpStatus: RsvpStatus.CONFIRMED },
        { fullName: 'Familia Sánchez (4 personas)', phone: '+525598765432', email: 'familia.sanchez@email.com', guestCount: 4, rsvpStatus: RsvpStatus.PENDING },
        { fullName: 'Diego y Carmen Torres', phone: '+525523456789', email: 'diego.torres@email.com', guestCount: 2, rsvpStatus: RsvpStatus.DECLINED },
    ];

    for (const guestData of guests1) {
        const guest = await prisma.guest.create({
            data: {
                ...guestData,
                eventId: event1.id,
            },
        });

        await prisma.invitation.create({
            data: {
                qrToken: `QR-${event1.id.substring(0, 8)}-${guest.id.substring(0, 8)}`,
                guestId: guest.id,
                eventId: event1.id,
            },
        });
    }

    // Create guests and invitations for Event 2 (XV Años)
    const guests2 = [
        { fullName: 'Familia González', phone: '+523312345678', email: 'gonzalez.fam@email.com', guestCount: 5, rsvpStatus: RsvpStatus.CONFIRMED },
        { fullName: 'Andrea y Luis Ramírez', phone: '+523387654321', email: 'andrea.ramirez@email.com', guestCount: 2, rsvpStatus: RsvpStatus.CONFIRMED },
        { fullName: 'Sofía Mendoza', phone: '+523398765432', email: 'sofia.mendoza@email.com', guestCount: 1, rsvpStatus: RsvpStatus.PENDING },
    ];

    for (const guestData of guests2) {
        const guest = await prisma.guest.create({
            data: {
                ...guestData,
                eventId: event2.id,
            },
        });

        await prisma.invitation.create({
            data: {
                qrToken: `QR-${event2.id.substring(0, 8)}-${guest.id.substring(0, 8)}`,
                guestId: guest.id,
                eventId: event2.id,
            },
        });
    }

    // Create guests and invitations for Event 3 (Conferencia)
    const guests3 = [
        { fullName: 'Ing. Ricardo Vega', phone: '+528112345678', email: 'ricardo.vega@tech.com', guestCount: 1, rsvpStatus: RsvpStatus.CONFIRMED },
        { fullName: 'Dra. Elena Castro', phone: '+528187654321', email: 'elena.castro@tech.com', guestCount: 1, rsvpStatus: RsvpStatus.CONFIRMED },
        { fullName: 'Equipo StartupMX', phone: '+528198765432', email: 'team@startupmx.com', guestCount: 3, rsvpStatus: RsvpStatus.CONFIRMED },
        { fullName: 'Prof. Alberto Ruiz', phone: '+528123456789', email: 'alberto.ruiz@university.edu', guestCount: 1, rsvpStatus: RsvpStatus.PENDING },
    ];

    for (const guestData of guests3) {
        const guest = await prisma.guest.create({
            data: {
                ...guestData,
                eventId: event3.id,
            },
        });

        await prisma.invitation.create({
            data: {
                qrToken: `QR-${event3.id.substring(0, 8)}-${guest.id.substring(0, 8)}`,
                guestId: guest.id,
                eventId: event3.id,
            },
        });
    }

    console.log('✅ Created 11 guests with invitations');

    // Summary
    console.log('\n📊 Seed Summary:');
    console.log('================');
    console.log(`👥 Users: ${await prisma.user.count()}`);
    console.log(`📅 Events: ${await prisma.event.count()}`);
    console.log(`👨‍👩‍👧‍👦 Guests: ${await prisma.guest.count()}`);
    console.log(`📧 Invitations: ${await prisma.invitation.count()}`);
    console.log('\n✅ Database seeded successfully!\n');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
