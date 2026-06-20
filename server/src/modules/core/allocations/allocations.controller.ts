import { Body, Controller, Param, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { AllocationsService } from './allocations.service';
import {
  CreateAllocationDto,
  CreateTransferDto,
  WriteOffExpiredDto,
} from './dto/allocation.dto';

@Controller('org/:id/allocations')
export class AllocationsController {
  constructor(private readonly allocationsService: AllocationsService) {}

  @Post()
  create(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: CreateAllocationDto,
  ) {
    return this.allocationsService.create(id, session.user.id, dto);
  }

  @Post('transfer')
  transfer(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: CreateTransferDto,
  ) {
    return this.allocationsService.transfer(id, session.user.id, dto);
  }

  @Post('write-off')
  writeOff(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: WriteOffExpiredDto,
  ) {
    return this.allocationsService.writeOffExpired(id, session.user.id, dto);
  }
}
