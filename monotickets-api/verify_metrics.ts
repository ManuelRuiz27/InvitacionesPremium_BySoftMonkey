import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MetricsService } from './src/metrics/metrics.service';
import { ExportsService } from './src/exports/exports.service';
import { PrismaService } from './src/prisma/prisma.service';

async function main() {
    console.log('📊 Starting Metrics & Exports Verification...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const metricsService = app.get(MetricsService);
    const exportsService = app.get(ExportsService);
    const prisma = app.get(PrismaService);

    // Get an event to test (using the one from seed which has guests)
    const event = await prisma.event.findFirst({ where: { name: 'Boda García - López' } });
    if (!event) {
        console.error('❌ Event not found for testing');
        await app.close();
        return;
    }

    // 1. Test Metrics
    console.log(`\n1. Testing Metrics for event: ${event.name}`);
    const metrics = await metricsService.getEventMetrics(event.id);
    console.log('📈 Metrics Result:', metrics);

    // 2. Test Exports
    console.log('\n2. Testing Exports...');

    try {
        const guestsCsv = await exportsService.exportGuests(event.id);
        console.log(`✅ Guests Export: Filename=${guestsCsv.filename}, Content Length=${guestsCsv.content.length}`);
    } catch (e) { console.error('❌ Guests Export Failed:', e.message); }

    try {
        const rsvpCsv = await exportsService.exportRsvp(event.id);
        console.log(`✅ RSVP Export: Filename=${rsvpCsv.filename}, Content Length=${rsvpCsv.content.length}`);
    } catch (e) { console.error('❌ RSVP Export Failed:', e.message); }

    try {
        const attendanceCsv = await exportsService.exportAttendance(event.id);
        console.log(`✅ Attendance Export: Filename=${attendanceCsv.filename}, Content Length=${attendanceCsv.content.length}`);
    } catch (e) { console.error('❌ Attendance Export Failed:', e.message); }

    await app.close();
}

main().catch(err => console.error(err));
