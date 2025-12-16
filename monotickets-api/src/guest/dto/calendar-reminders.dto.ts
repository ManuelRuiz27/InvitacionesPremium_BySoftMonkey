import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsIn, IsOptional } from 'class-validator';

export const CALENDAR_REMINDER_OPTIONS = ['P3D', 'P7D', 'P15D', 'P1M'] as const;

export class CalendarRemindersDto {
  @ApiPropertyOptional({
    description:
      'Lista de recordatorios en formato ISO8601 Duration (negativa)',
    enum: CALENDAR_REMINDER_OPTIONS,
    isArray: true,
    example: ['P3D', 'P7D'],
  })
  @IsArray()
  @ArrayMaxSize(4)
  @IsIn(CALENDAR_REMINDER_OPTIONS, { each: true })
  @IsOptional()
  reminders?: string[];
}
