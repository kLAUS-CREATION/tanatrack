import { Controller, Get, Param, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { InventoryService } from './inventory.service';
import { LocationStockQueryDto } from './dto/inventory.dto';

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

  @Get('low-stock')
  lowStock(@Param('id') id: string, @Session() session: UserSession) {
    return this.inventoryService.lowStock(id, session.user.id);
  }

  @Get('movements')
  movements(
    @Param('id') id: string,
    @Query('variantId') variantId: string | undefined,
    @Session() session: UserSession,
  ) {
    return this.inventoryService.movements(id, session.user.id, variantId);
  }

  // Dated expiry batches for perishable stock (drives the Expiry view).
  @Get('batches')
  batches(@Param('id') id: string, @Session() session: UserSession) {
    return this.inventoryService.batches(id, session.user.id);
  }
}
