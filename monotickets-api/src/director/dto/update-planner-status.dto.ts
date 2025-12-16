import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePlannerStatusDto {
  @ApiProperty({
    description: 'Estado activo/inactivo del planner',
    example: true,
  })
  @IsBoolean()
  active: boolean;
}
