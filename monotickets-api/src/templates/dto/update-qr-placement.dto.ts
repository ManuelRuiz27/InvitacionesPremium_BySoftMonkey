import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, Min, Max, IsInt } from 'class-validator';

export class UpdateQrPlacementDto {
  @ApiProperty({
    description: 'Page index where the QR should be placed',
    example: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pageIndex: number;

  @ApiProperty({ description: 'Normalized X coordinate (0..1)', example: 0.7 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  x: number;

  @ApiProperty({ description: 'Normalized Y coordinate (0..1)', example: 0.8 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  y: number;

  @ApiProperty({ description: 'Normalized width (0..1)', example: 0.2 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.05)
  @Max(1)
  w: number;

  @ApiProperty({ description: 'Normalized height (0..1)', example: 0.2 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.05)
  @Max(1)
  h: number;

  @ApiProperty({
    description: 'Rotation degrees (0,90,180,270)',
    example: 0,
    default: 0,
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsIn([0, 90, 180, 270])
  rotation = 0;
}
