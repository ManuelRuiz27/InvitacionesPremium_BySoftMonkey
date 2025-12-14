import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { AutoCloseJob } from './jobs/auto-close.job';

@Module({
    controllers: [EventsController],
    providers: [EventsService, AutoCloseJob],
    exports: [EventsService],
})
export class EventsModule { }
