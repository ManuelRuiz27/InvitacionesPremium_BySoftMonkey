import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsOptional,
    IsInt,
    Min,
    Max,
    IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RsvpStatus } from '@prisma/client';

export class CreateGuestDto {
    @ApiProperty({
        description: 'Guest full name',
        example: 'Juan Pérez García',
    })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiPropertyOptional({
        description: 'Guest phone number',
        example: '+52 55 1234 5678',
    })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({
        description: 'Guest email',
        example: 'juan.perez@example.com',
    })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({
        description: 'Number of guests (including main guest)',
        example: 2,
        minimum: 1,
        maximum: 10,
    })
    @IsInt()
    @Min(1)
    @Max(10)
    guestCount: number;

    @ApiPropertyOptional({
        description: 'RSVP status',
        enum: RsvpStatus,
        example: 'PENDING',
    })
    @IsEnum(RsvpStatus)
    @IsOptional()
    rsvpStatus?: RsvpStatus;
}
