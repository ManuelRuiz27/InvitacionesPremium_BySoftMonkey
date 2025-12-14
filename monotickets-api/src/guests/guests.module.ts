import { Module } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { GuestsController } from './guests.controller';
import { CsvImportService } from './csv-import.service';

@Module({
    controllers: [GuestsController],
    providers: [GuestsService, CsvImportService],
    exports: [GuestsService],
})
export class GuestsModule { }
