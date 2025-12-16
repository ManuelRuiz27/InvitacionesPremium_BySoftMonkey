import { Controller, Post, Param, Delete, Body } from '@nestjs/common';
import { PrivacyService } from './privacy.service';

@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Post('anonymize/:eventId')
  async anonymizeEvent(@Param('eventId') eventId: string) {
    return this.privacyService.anonymizeEventGuests(eventId);
  }

  @Delete('event/:eventId')
  async deleteEvent(@Param('eventId') eventId: string) {
    return this.privacyService.deleteEvent(eventId);
  }

  @Post('run-retention')
  async runRetention() {
    return this.privacyService.runRetentionPolicy();
  }
}
