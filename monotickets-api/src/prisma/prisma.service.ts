import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {
        super();
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.info('Database connected successfully', { context: 'PrismaService' });
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.info('Database disconnected', { context: 'PrismaService' });
    }
}
