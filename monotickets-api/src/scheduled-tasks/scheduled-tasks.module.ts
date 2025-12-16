import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventClosureService } from './event-closure.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { DeliveryRetryService } from './delivery-retry.service';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, DeliveryModule],
  providers: [EventClosureService, DeliveryRetryService],
  exports: [EventClosureService, DeliveryRetryService],
})
export class ScheduledTasksModule {}
