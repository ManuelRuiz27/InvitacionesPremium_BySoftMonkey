import { Module } from '@nestjs/common';
import { ScannerController } from './scanner.controller';
import { ScannerService } from './scanner.service';
import { QrModule } from '../common/services/qr.module';

@Module({
<<<<<<< HEAD
  controllers: [ScannerController],
  providers: [ScannerService],
  exports: [ScannerService],
=======
    imports: [QrModule],
    controllers: [ScannerController],
    providers: [ScannerService],
    exports: [ScannerService],
>>>>>>> ff183bdbed4957932f8d0fec1d925d02cf1e8910
})
export class ScannerModule {}
