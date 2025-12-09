import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RsvpStatus } from '@prisma/client';

export class RsvpDto {
    @ApiProperty({
        description: 'QR token from invitation',
        example: 'EV-550E8400-E29B41D4-ABC123-DEF456',
    })
    @IsString()
    @IsNotEmpty()
    qrToken: string;

    @ApiProperty({
        description: 'RSVP status',
        enum: RsvpStatus,
        example: 'CONFIRMED',
    })
    @IsEnum(RsvpStatus)
    @IsNotEmpty()
    status: RsvpStatus;
}
