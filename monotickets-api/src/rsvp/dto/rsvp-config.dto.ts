import {
    IsString,
    IsNotEmpty,
    IsBoolean,
    IsOptional,
    IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RsvpConfigDto {
    @ApiProperty({
        description: 'Event ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsString()
    @IsNotEmpty()
    eventId: string;

    @ApiProperty({
        description: 'Enable RSVP',
        example: true,
    })
    @IsBoolean()
    enabled: boolean;

    @ApiPropertyOptional({
        description: 'RSVP deadline',
        example: '2025-12-20T23:59:59.999Z',
    })
    @IsOptional()
    @IsDateString()
    deadline?: string;

    @ApiPropertyOptional({
        description: 'Custom RSVP message',
        example: 'Por favor confirma tu asistencia antes del 20 de diciembre',
    })
    @IsOptional()
    @IsString()
    message?: string;

    @ApiProperty({
        description: 'Allow plus ones',
        example: true,
    })
    @IsBoolean()
    allowPlusOnes: boolean;
}
