import { Module } from '@nestjs/common';
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
