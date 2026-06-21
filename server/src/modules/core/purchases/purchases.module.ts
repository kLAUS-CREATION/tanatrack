import { forwardRef, Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ChangeRequestModule } from '../change-requests/change-request.module';

@Module({
  imports: [InventoryModule, forwardRef(() => ChangeRequestModule)],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
