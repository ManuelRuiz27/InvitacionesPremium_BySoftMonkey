import {
    IsString,
    IsNotEmpty,
    IsDateString,
    IsOptional,
    IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
    @ApiProperty({
        description: 'Event name',
        example: 'Boda de Juan y María',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Event date',
        example: '2025-12-25T18:00:00.000Z',
    })
    @IsDateString()
    @IsNotEmpty()
    date: string;

    @ApiPropertyOptional({
        description: 'Event location',
        example: 'Jardín Las Rosas, CDMX',
    })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiPropertyOptional({
        description: 'Event description',
        example: 'Celebración de nuestra boda',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Planner user ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    @IsNotEmpty()
    plannerId: string;
}
