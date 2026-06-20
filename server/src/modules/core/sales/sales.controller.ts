import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/sale.dto';
import { CreateReturnDto } from './dto/return.dto';

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

  // Declared before the `:saleId` catch-all so it isn't swallowed as a sale id.
  @Get('sellable-branches')
  sellableBranches(@Param('id') id: string, @Session() session: UserSession) {
    return this.salesService.sellableBranches(id, session.user.id);
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

  @Post(':saleId/returns')
  createReturn(
    @Param('id') id: string,
    @Param('saleId') saleId: string,
    @Session() session: UserSession,
    @Body() dto: CreateReturnDto,
  ) {
    return this.salesService.createReturn(id, session.user.id, saleId, dto);
  }
}
