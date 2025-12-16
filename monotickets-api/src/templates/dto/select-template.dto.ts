import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SelectTemplateDto {
  @ApiProperty({
    description: 'Template ID to assign',
    example: 'tmpl_123',
  })
  @IsString()
  @IsNotEmpty()
  templateId: string;
}
