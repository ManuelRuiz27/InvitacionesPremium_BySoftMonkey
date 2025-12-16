import { ApiPropertyOptional } from '@nestjs/swagger';
import { InviteMode } from '@prisma/client';
import { IsEnum, IsOptional, IsObject } from 'class-validator';

export class UpdatePlannerSettingsDto {
  @ApiPropertyOptional({
    description: 'Default branding values (logo/colors)',
    example: {
      logoMediaId: 'med_123',
      colors: {
        primary: '#000000',
        secondary: '#FFFFFF',
        accent: '#FFB347',
        background: '#F5F5F5',
      },
    },
  })
  @IsOptional()
  @IsObject()
  brandDefaults?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Preferred invitation mode when creating events',
    enum: InviteMode,
    example: InviteMode.PDF,
  })
  @IsOptional()
  @IsEnum(InviteMode)
  preferredInviteMode?: InviteMode;
}
