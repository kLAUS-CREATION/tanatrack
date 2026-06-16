import { forwardRef, Module } from '@nestjs/common';
import { ChangeRequestController } from './change-request.controller';
import { ChangeRequestService } from './change-request.service';
import { ProductsModule } from '../products/products.module';
import { PurchasesModule } from '../purchases/purchases.module';
import { AllocationsModule } from '../allocations/allocations.module';

@Module({
  imports: [
    forwardRef(() => ProductsModule),
    forwardRef(() => PurchasesModule),
    forwardRef(() => AllocationsModule),
  ],
  controllers: [ChangeRequestController],
  providers: [ChangeRequestService],
  exports: [ChangeRequestService],
})
export class ChangeRequestModule {}
