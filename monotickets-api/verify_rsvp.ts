import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { RsvpService } from './src/rsvp/rsvp.service';
import { PrismaService } from './src/prisma/prisma.service';
import { RsvpConfigService } from './src/rsvp/rsvp-config.service';

async function main() {
    console.log('🧪 Starting RSVP Verification...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const rsvpService = app.get(RsvpService);
    const prisma = app.get(PrismaService);
    const configService = app.get(RsvpConfigService);

    // TEST 1: CONFIRMATION
    console.log('\n1. Testing Confirmation...');
    const guestConfirm = await prisma.guest.findFirst({ where: { fullName: 'Ana López' } });
    if (guestConfirm) {
        await rsvpService.confirm(guestConfirm.id);
        const updated = await prisma.guest.findUnique({ where: { id: guestConfirm.id } });
        console.log(`✅ Ana López Status: ${updated?.rsvpStatus} | ConfirmedAt: ${(updated as any)?.confirmedAt}`);
    }

    // TEST 2: ALLOWED REVOCATION
    console.log('\n2. Testing Allowed Revocation (Window OK)...');
    const guestRevocable = await prisma.guest.findFirst({ where: { fullName: 'Guest Revocable' } });
    if (guestRevocable) {
        // Ensure config is created first
        await configService.getOrCreateConfig(guestRevocable.eventId);

        await rsvpService.decline(guestRevocable.id);
        const updated = await prisma.guest.findUnique({ where: { id: guestRevocable.id } });
        console.log(`✅ Guest Revocable Status: ${updated?.rsvpStatus} | DeclinedAt: ${(updated as any)?.declinedAt}`);
    } else {
        console.error('❌ Guest Revocable not found');
    }

    // TEST 3: BLOCKED REVOCATION
    console.log('\n3. Testing Blocked Revocation (Window Expired)...');
    const guestNonRevocable = await prisma.guest.findFirst({ where: { fullName: 'Guest Non-Revocable' } });
    if (guestNonRevocable) {
        await configService.getOrCreateConfig(guestNonRevocable.eventId);
        try {
            await rsvpService.decline(guestNonRevocable.id);
            console.error('❌ FAILED: Revocation should have been blocked!');
        } catch (error) {
            console.log(`✅ Successfully blocked revocation: ${error.message}`);
        }
    } else {
        console.error('❌ Guest Non-Revocable not found');
    }

    // TEST 4: MANUAL CONFIRMATION
    console.log('\n4. Testing Manual Confirmation...');
    const guestManual = await prisma.guest.findFirst({ where: { fullName: 'Guest Manual Confirm' } });
    const planner = await prisma.user.findUnique({ where: { email: 'planner@monotickets.com' } });

    if (guestManual && planner) {
        await rsvpService.manualConfirm(guestManual.id, planner.id);
        const updated = await prisma.guest.findUnique({ where: { id: guestManual.id } });
        console.log(`✅ Guest Manual Status: ${updated?.rsvpStatus} | ConfirmedAt: ${(updated as any)?.confirmedAt}`);
    }

    await app.close();
}

main().catch(err => console.error(err));
