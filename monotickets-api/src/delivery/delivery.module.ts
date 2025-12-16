import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
=======
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';
import { DeliveryController } from './delivery.controller';
import {
    MockSmsProvider,
    MockWhatsAppProvider,
} from './providers/delivery-provider.interface';

@Module({
    controllers: [DeliveryController],
    providers: [
        DeliveryOrchestratorService,
        {
            provide: 'SMS_PROVIDER',
            useClass: MockSmsProvider,
        },
        {
            provide: 'WHATSAPP_PROVIDER',
            useClass: MockWhatsAppProvider,
        },
    ],
    exports: [DeliveryOrchestratorService],
})
export class DeliveryModule { }
>>>>>>> ff183bdbed4957932f8d0fec1d925d02cf1e8910
