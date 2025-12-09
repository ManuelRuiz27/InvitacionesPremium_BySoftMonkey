import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        let msg = `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    }),
);

@Module({
    imports: [
        WinstonModule.forRoot({
            transports: [
                // Console transport for development
                new winston.transports.Console({
                    format: consoleFormat,
                    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
                }),
                // File transport for errors
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    format: logFormat,
                }),
                // File transport for all logs
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    format: logFormat,
                }),
            ],
        }),
    ],
    exports: [WinstonModule],
})
export class LoggerModule { }
