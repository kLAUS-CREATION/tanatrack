import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { InventoryService } from './inventory.service';
import {
  AdjustStockDto,
  LocationStockQueryDto,
  PurchaseInDto,
  TransferStockDto,
} from './dto/inventory.dto';

@Controller('org/:id/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock')
  globalStock(@Param('id') id: string, @Session() session: UserSession) {
    return this.inventoryService.globalStock(id, session.user.id);
  }

  @Get('stock/location')
  locationStock(
    @Param('id') id: string,
    @Query() query: LocationStockQueryDto,
    @Session() session: UserSession,
  ) {
    return this.inventoryService.locationStock(id, session.user.id, query);
  }

  @Get('movements')
  movements(
    @Param('id') id: string,
    @Query('variantId') variantId: string | undefined,
    @Session() session: UserSession,
  ) {
    return this.inventoryService.movements(id, session.user.id, variantId);
  }

  @Post('purchase-in')
  purchaseIn(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: PurchaseInDto,
  ) {
    return this.inventoryService.purchaseIn(id, session.user.id, dto);
  }

  @Post('adjust')
  adjust(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(id, session.user.id, dto);
  }

  @Post('transfer')
  transfer(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: TransferStockDto,
  ) {
    return this.inventoryService.transferStock(id, session.user.id, dto);
  }
}
