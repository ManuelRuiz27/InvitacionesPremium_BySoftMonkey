import { Module } from '@nestjs/common';
import { RsvpService } from './rsvp.service';
import { RsvpController } from './rsvp.controller';
import { RsvpConfigService } from './rsvp-config.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RsvpController],
  providers: [RsvpService, RsvpConfigService],
  exports: [RsvpService, RsvpConfigService],
})
export class RsvpModule {}
