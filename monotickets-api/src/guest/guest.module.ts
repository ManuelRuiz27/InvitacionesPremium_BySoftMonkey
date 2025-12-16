import { Module } from '@nestjs/common';
import { GuestService } from './guest.service';
import { GuestController } from './guest.controller';
import { PublicInviteController } from './public-invite.controller';

@Module({
  controllers: [GuestController, PublicInviteController],
  providers: [GuestService],
  exports: [GuestService],
})
export class GuestModule {}
