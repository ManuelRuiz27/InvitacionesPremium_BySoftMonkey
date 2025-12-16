import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { AutoCloseJob } from './jobs/auto-close.job';

@Module({
<<<<<<< HEAD
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
=======
    controllers: [EventsController],
    providers: [EventsService, AutoCloseJob],
    exports: [EventsService],
>>>>>>> ff183bdbed4957932f8d0fec1d925d02cf1e8910
})
export class EventsModule {}
