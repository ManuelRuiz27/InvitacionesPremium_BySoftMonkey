import { IsString, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScanValidationDto {
  @ApiProperty({
    description: 'QR token to validate',
    example: 'EV2025-001-GUEST-123-ABC',
  })
  @IsString()
  @IsNotEmpty()
  qrToken: string;

  @ApiProperty({
    description: 'Event ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({
    description: 'Staff user ID who is scanning',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsNotEmpty()
  scannedBy: string;

  @ApiProperty({
    description: 'Timestamp when scan occurred',
    example: '2025-12-05T15:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  scannedAt: string;
}
