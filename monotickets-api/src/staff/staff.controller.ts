import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StaffService } from './staff.service';

@ApiTags('staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post('login')
  @ApiOperation({ summary: 'Staff login (placeholder)' })
  @ApiResponse({ status: 501, description: 'Not implemented yet' })
  async login() {
    await this.staffService.login();
  }
}
