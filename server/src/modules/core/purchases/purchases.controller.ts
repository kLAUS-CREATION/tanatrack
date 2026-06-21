import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/purchase.dto';
import { CreatePurchaseReturnDto } from './dto/purchase-return.dto';

@Controller('org/:id/purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  findAll(@Param('id') id: string, @Session() session: UserSession) {
    return this.purchasesService.findAll(id, session.user.id);
  }

  @Get(':purchaseId')
  findOne(
    @Param('id') id: string,
    @Param('purchaseId') purchaseId: string,
    @Session() session: UserSession,
  ) {
    return this.purchasesService.findOne(id, session.user.id, purchaseId);
  }

  @Get(':purchaseId/returns')
  findReturns(
    @Param('id') id: string,
    @Param('purchaseId') purchaseId: string,
    @Session() session: UserSession,
  ) {
    return this.purchasesService.findReturns(id, session.user.id, purchaseId);
  }

  @Post()
  create(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchasesService.create(id, session.user.id, dto);
  }

  @Post(':purchaseId/returns')
  createReturn(
    @Param('id') id: string,
    @Param('purchaseId') purchaseId: string,
    @Session() session: UserSession,
    @Body() dto: CreatePurchaseReturnDto,
  ) {
    return this.purchasesService.createReturn(
      id,
      session.user.id,
      purchaseId,
      dto,
    );
  }
}
