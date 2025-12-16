import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrivacyService } from './src/privacy/privacy.service';
import { PrismaService } from './src/prisma/prisma.service';
import { EventStatus } from '@prisma/client';

/**
 * Verification Script for Sprint 6: Retention & Privacy
 * 1. Creates a dummy event with old date.
 * 2. Runs retention policy (should anonymize it).
 * 3. Deletes a specific event (Right to be Forgotten).
 */
async function main() {
    console.log('🛡️ Starting Privacy Verification...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const privacyService = app.get(PrivacyService);
    const prisma = app.get(PrismaService);

    // SETUP: Create a mock OLD event (13 months ago)
    const oldDate = new Date();
    oldDate.setMonth(oldDate.getMonth() - 13);

    // Need a planner
    let planner = await prisma.user.findUnique({ where: { email: 'planner@monotickets.com' } });
    if (!planner) {
        console.warn('⚠️ Planner not found, creating dummy planner for test...');
        planner = await prisma.user.create({
            data: {
                email: 'planner@monotickets.com',
                password: 'hash',
                fullName: 'Test Planner',
                role: 'PLANNER'
            }
        });
    }

    const oldEvent = await prisma.event.create({
        data: {
            name: 'Old Event (To Anonymize)',
            date: oldDate,
            location: 'Old Loc',
            description: 'Should be anonymized',
            plannerId: planner.id,
            status: EventStatus.PUBLISHED
        }
    });

    const oldGuest = await prisma.guest.create({
        data: {
            fullName: 'Old Guest Name',
            phone: '+0000000000',
            email: 'old@test.com',
            guestCount: 2,
            rsvpStatus: 'CONFIRMED',
            eventId: oldEvent.id
        }
    });

    console.log(`\n1. Created Old Event: ${oldEvent.name} (${oldEvent.id}) with guest: ${oldGuest.fullName}`);

    // TEST 1: Retention Policy (Anonymization)
    console.log('\n2. Running Retention Policy...');
    const anonymized = await privacyService.runRetentionPolicy();
    console.log('🔐 Anonymization Results:', anonymized);

    // Verify
    const updatedGuest = await prisma.guest.findUnique({ where: { id: oldGuest.id } });
    if (updatedGuest?.fullName.startsWith('Anonymized Guest') && updatedGuest?.phone === null) {
        console.log('✅ Guest anonymized successfully!');
    } else {
        console.error('❌ Anonymization failed:', updatedGuest);
    }

    // TEST 2: Right to be Forgotten (Deletion)
    console.log('\n3. Testing Event Deletion (Right to be Forgotten)...');
    // Using the same event for cleanup
    await privacyService.deleteEvent(oldEvent.id);

    const verifyDeletion = await prisma.event.findUnique({ where: { id: oldEvent.id } });
    if (!verifyDeletion) {
        console.log('✅ Event deleted successfully!');
    } else {
        console.error('❌ Deletion failed!');
    }

    await app.close();
}

main().catch(err => console.error(err));
