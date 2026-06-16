import { forwardRef, Module } from '@nestjs/common';
import { AllocationsController } from './allocations.controller';
import { AllocationsService } from './allocations.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ChangeRequestModule } from '../change-requests/change-request.module';

@Module({
  imports: [InventoryModule, forwardRef(() => ChangeRequestModule)],
  controllers: [AllocationsController],
  providers: [AllocationsService],
  exports: [AllocationsService],
})
export class AllocationsModule {}
