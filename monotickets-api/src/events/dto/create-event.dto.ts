import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InviteMode } from '@prisma/client';

export class CreateEventDto {
  @ApiProperty({
    description: 'Event name',
    example: 'Boda de Juan y MarA-a',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Event category (BODA, XV, GRADUACION, etc.)',
    example: 'BODA',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Event datetime (ISO)',
    example: '2025-12-25T18:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  eventAt: string;

  @ApiPropertyOptional({
    description: 'Venue or location text presented to guests',
    example: 'JardA-n Las Rosas, CDMX',
  })
  @IsString()
  @IsOptional()
  venueText?: string;

  @ApiPropertyOptional({
    description: 'Physical location/address helper',
    example: 'Hacienda X, CDMX',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: 'Event description shown in invitation',
    example: 'CelebraciA3n de nuestra boda',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Preferred invitation mode',
    enum: InviteMode,
    default: InviteMode.PDF,
  })
  @IsEnum(InviteMode)
  @IsOptional()
  inviteMode?: InviteMode;

  @ApiPropertyOptional({
    description: 'Default guest count per invitation',
    example: 2,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  guestCountDefault?: number;

  @ApiPropertyOptional({
    description: 'Allow partial entry scanning (group QR)',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  allowPartialEntry?: boolean;

  @ApiProperty({
    description: 'Planner user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  plannerId: string;
}
