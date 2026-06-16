import { forwardRef, Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ChangeRequestModule } from '../change-requests/change-request.module';

@Module({
  imports: [forwardRef(() => ChangeRequestModule)],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
