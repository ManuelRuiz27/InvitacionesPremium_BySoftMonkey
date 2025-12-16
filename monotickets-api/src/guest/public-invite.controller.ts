import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { GuestService } from './guest.service';
import { CalendarRemindersDto } from './dto/calendar-reminders.dto';

@ApiTags('public-invite')
@Controller('public/invite')
export class PublicInviteController {
  constructor(private readonly guestService: GuestService) {}

  @Post(':token/calendar/ics')
  @ApiOperation({
    summary: 'Generar archivo ICS con recordatorios seleccionados',
  })
  @ApiBody({ type: CalendarRemindersDto })
  @ApiResponse({ status: 200, description: 'ICS generado correctamente' })
  async generateCalendar(
    @Param('token') token: string,
    @Body() calendarDto: CalendarRemindersDto,
    @Res() res: Response,
  ) {
    const calendar = await this.guestService.getCalendar(token, calendarDto);
    res.setHeader('Content-Type', calendar.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${calendar.filename}"`,
    );
    res.send(calendar.content);
  }

  @Get(':token/memory')
  @ApiOperation({ summary: 'Obtener modo recuerdo en JSON (sólo lectura)' })
  @ApiResponse({
    status: 200,
    description: 'Información de recuerdo devuelta correctamente',
  })
  getMemory(@Param('token') token: string) {
    return this.guestService.getMemoryView(token);
  }

  @Get(':token/memory.pdf')
  @ApiOperation({ summary: 'Descargar PDF de recuerdo' })
  @ApiResponse({ status: 200, description: 'PDF generado correctamente' })
  async getMemoryPdf(@Param('token') token: string, @Res() res: Response) {
    const pdf = await this.guestService.getMemoryPdf(token);
    res.setHeader('Content-Type', pdf.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${pdf.filename}"`,
    );
    res.send(pdf.content);
  }
}
