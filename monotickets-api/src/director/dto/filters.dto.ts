import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class FiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by date from',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by date to',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by planner ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  plannerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: UserRole,
    example: 'PLANNER',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
