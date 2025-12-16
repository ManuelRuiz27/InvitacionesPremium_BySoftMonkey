import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateGuestDto } from './create-guest.dto';

export class BulkUploadDto {
  @ApiProperty({
    description: 'Array of guests to create',
    type: [CreateGuestDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGuestDto)
  guests: CreateGuestDto[];
}
