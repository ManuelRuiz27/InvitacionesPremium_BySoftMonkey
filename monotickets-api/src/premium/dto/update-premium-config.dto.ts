import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdatePremiumConfigDto {
  @ApiProperty({ description: 'Efecto visual', enum: ['FLIPBOOK', 'SCROLL'] })
  @IsString()
  effect: string;

  @ApiProperty({
    description: 'Colores principales',
    example: { primary: '#000000', secondary: '#FFFFFF' },
  })
  @IsObject()
  colors: Record<string, any>;

  @ApiProperty({
    description: 'Secciones de la landing premium',
    example: { cover: { title: '...' } },
  })
  @IsObject()
  sections: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Reducir movimiento por defecto',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  reduceMotionDefault?: boolean;
}
