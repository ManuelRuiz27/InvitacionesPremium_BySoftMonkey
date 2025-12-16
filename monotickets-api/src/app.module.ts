import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { ScannerModule } from './scanner/scanner.module';
import { DeliveryModule } from './delivery/delivery.module';
import { ExportsModule } from './exports/exports.module';
import { MetricsModule } from './metrics/metrics.module';
import { EventsModule } from './events/events.module';
import { GuestsModule } from './guests/guests.module';
import { InvitationsModule } from './invitations/invitations.module';
import { GuestModule } from './guest/guest.module';
import { DirectorModule } from './director/director.module';
import { RsvpModule } from './rsvp/rsvp.module';
<<<<<<< HEAD
import { PrivacyModule } from './privacy/privacy.module';
import { ScheduledTasksModule } from './scheduled-tasks/scheduled-tasks.module';
import { PremiumModule } from './premium/premium.module';
import { PlannersModule } from './planners/planners.module';
import { TemplatesModule } from './templates/templates.module';
import { MediaModule } from './media/media.module';
import { StaffModule } from './staff/staff.module';
=======
import { DeliveryModule } from './delivery/delivery.module';
>>>>>>> ff183bdbed4957932f8d0fec1d925d02cf1e8910

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'strict',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute (for sensitive endpoints)
      },
    ]),
    LoggerModule,
    PrismaModule,
    AuthModule,
    ScannerModule,
    EventsModule,
    GuestsModule,
    InvitationsModule,
    GuestModule,
    DirectorModule,
    RsvpModule,
    DeliveryModule,
<<<<<<< HEAD
    ExportsModule,
    MetricsModule,
    PrivacyModule,
    PremiumModule,
    PlannersModule,
    TemplatesModule,
    MediaModule,
    StaffModule,
    ScheduledTasksModule,
=======
>>>>>>> ff183bdbed4957932f8d0fec1d925d02cf1e8910
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
