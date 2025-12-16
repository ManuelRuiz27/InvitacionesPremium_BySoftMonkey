import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OfflineScanDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  qrToken: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  scannedBy: string;

  @ApiProperty()
  scannedAt: string;
}

export class SyncScansDto {
  @ApiProperty({
    description: 'Array of offline scans to sync',
    type: [OfflineScanDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfflineScanDto)
  scans: OfflineScanDto[];
}
