import { Controller, Get, Param } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ReportsService } from './reports.service';

@Controller('org/:id/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  overview(@Param('id') id: string, @Session() session: UserSession) {
    return this.reportsService.overview(id, session.user.id);
  }
}
