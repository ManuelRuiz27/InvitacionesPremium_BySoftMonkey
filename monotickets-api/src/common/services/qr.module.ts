import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QrService } from './qr.service';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            signOptions: { expiresIn: '24h' }, // Default, overridden per token
        }),
    ],
    providers: [QrService],
    exports: [QrService],
})
export class QrModule { }
