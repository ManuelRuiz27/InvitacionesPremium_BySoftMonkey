import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadTemplateDto {
  @ApiProperty({
    description: 'Template display name',
    example: 'Clásica Dorada',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Template category (BODA, XV, etc.)',
    example: 'BODA',
  })
  @IsString()
  @IsNotEmpty()
  category: string;
}
