import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { EventClosureService } from './src/scheduled-tasks/event-closure.service';
import { PrismaService } from './src/prisma/prisma.service';
import { EventStatus } from '@prisma/client';

async function main() {
    console.log('⏰ Starting Automatic Closure Verification...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const closureService = app.get(EventClosureService);
    const prisma = app.get(PrismaService);

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

    // Create an event that SHOULD be closed (4 days ago)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 4); // 96 hours ago > 72h

    const eventToClose = await prisma.event.create({
        data: {
            name: 'Event To Close',
            date: oldDate,
            location: 'Loc',
            description: 'Should be auto closed',
            plannerId: planner!.id,
            status: EventStatus.PUBLISHED
        }
    });

    console.log(`\n1. Created Event to Close: ${eventToClose.id} (Date: ${oldDate.toISOString()})`);

    // Create an event that SHOULD NOT be closed (1 day ago)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 1); // 24 hours ago < 72h

    const eventActive = await prisma.event.create({
        data: {
            name: 'Event Active',
            date: recentDate,
            location: 'Loc',
            description: 'Should stay active',
            plannerId: planner!.id,
            status: EventStatus.PUBLISHED
        }
    });

    console.log(`2. Created Event Active: ${eventActive.id} (Date: ${recentDate.toISOString()})`);

    // RUN CLOSURE JOB
    console.log('\n3. Running Closure Logic...');
    const result = await closureService.handleEventClosure();
    console.log('🔄 Closure Result:', result);

    // VERIFY
    const checkClosed = await prisma.event.findUnique({ where: { id: eventToClose.id } });
    const checkActive = await prisma.event.findUnique({ where: { id: eventActive.id } });

    if (checkClosed?.status === EventStatus.CLOSED) {
        console.log('✅ Old event closed successfully!');
    } else {
        console.error('❌ Old event NOT closed:', checkClosed?.status);
    }

    if (checkActive?.status === EventStatus.PUBLISHED) {
        console.log('✅ Recent event remained active successfully!');
    } else {
        console.error('❌ Recent event was incorrectly closed:', checkActive?.status);
    }

    // Cleanup
    await prisma.event.deleteMany({ where: { id: { in: [eventToClose.id, eventActive.id] } } });

    await app.close();
}

main().catch(err => console.error(err));
