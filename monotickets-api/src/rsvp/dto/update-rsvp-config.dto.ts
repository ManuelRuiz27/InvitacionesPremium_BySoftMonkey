import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRsvpConfigDto {
  @ApiProperty({ description: 'Allow RSVP confirmations', required: false })
  @IsBoolean()
  @IsOptional()
  allowRsvp?: boolean;

  @ApiProperty({
    description: 'Days before event to close RSVP (0 = Event Day)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  rsvpDeadlineDays?: number;

  @ApiProperty({
    description: 'Days after receipt to allow revocation',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  revocationWindowDays?: number;
}

export class CreateRsvpConfigDto extends UpdateRsvpConfigDto {}
