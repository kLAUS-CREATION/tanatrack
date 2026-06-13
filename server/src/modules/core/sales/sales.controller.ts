import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/sale.dto';

@Controller('org/:id/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll(@Param('id') id: string, @Session() session: UserSession) {
    return this.salesService.findAll(id, session.user.id);
  }

  @Get('branch/:branchId')
  findByBranch(
    @Param('id') id: string,
    @Param('branchId') branchId: string,
    @Session() session: UserSession,
  ) {
    return this.salesService.findByBranch(id, session.user.id, branchId);
  }

  @Get(':saleId')
  findOne(
    @Param('id') id: string,
    @Param('saleId') saleId: string,
    @Session() session: UserSession,
  ) {
    return this.salesService.findOne(id, session.user.id, saleId);
  }

  @Post()
  create(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: CreateSaleDto,
  ) {
    return this.salesService.create(id, session.user.id, dto);
  }
}
