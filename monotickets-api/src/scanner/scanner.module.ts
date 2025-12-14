import { Module } from '@nestjs/common';
import { ScannerController } from './scanner.controller';
import { ScannerService } from './scanner.service';
import { QrModule } from '../common/services/qr.module';

@Module({
    imports: [QrModule],
    controllers: [ScannerController],
    providers: [ScannerService],
    exports: [ScannerService],
})
export class ScannerModule { }
