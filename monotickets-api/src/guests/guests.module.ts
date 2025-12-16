import { Module } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { GuestsController } from './guests.controller';
import { CsvImportService } from './csv-import.service';

@Module({
<<<<<<< HEAD
  controllers: [GuestsController],
  providers: [GuestsService],
  exports: [GuestsService],
=======
    controllers: [GuestsController],
    providers: [GuestsService, CsvImportService],
    exports: [GuestsService],
>>>>>>> ff183bdbed4957932f8d0fec1d925d02cf1e8910
})
export class GuestsModule {}
