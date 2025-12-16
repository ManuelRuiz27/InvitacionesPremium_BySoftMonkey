import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DeliveryService } from './src/delivery/delivery.service';
import { PrismaService } from './src/prisma/prisma.service';

async function main() {
    console.log('🚀 Starting Delivery Verification...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const deliveryService = app.get(DeliveryService);
    const prisma = app.get(PrismaService);

    // Get a valid invitation ID from our seeded data
    const guest = await prisma.guest.findFirst({
        where: { fullName: 'Carlos Rodríguez' },
        include: { invitations: true }
    });

    if (!guest || !guest.invitations[0]) {
        console.error('❌ Could not find test guest Carlos Rodríguez');
        await app.close();
        return;
    }

    const invitationId = guest.invitations[0].id;
    console.log(`📧 Testing delivery for Invitation ID: ${invitationId}`);

    try {
        const result = await deliveryService.sendInvitation(invitationId);
        console.log('✅ Result:', result);
    } catch (error) {
        console.error('⚠️ Delivery attempt failed (expected if no credentials):', error.message);
    }

    // Check logs
    const attempts = await prisma.deliveryAttempt.findMany({
        where: { invitationId }
    });

    console.log('\n📊 Delivery Attempts Logged:');
    attempts.forEach(a => {
        console.log(`- [${a.method}] Status: ${a.status} | Error: ${a.errorMessage || 'None'}`);
    });

    await app.close();
}

main();
