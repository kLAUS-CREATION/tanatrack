import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { SupplierQueryDto } from './dto/supplier-query.dto';

@Controller('org/:id/suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll(@Param('id') id: string, @Session() session: UserSession) {
    return this.suppliersService.findAll(id, session.user.id);
  }

  // Declared before the `:supplierId` catch-all so it isn't read as an id.
  @Get('paged')
  findAllPaged(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Query() query: SupplierQueryDto,
  ) {
    return this.suppliersService.findAllPaged(id, session.user.id, query);
  }

  @Get(':supplierId')
  findOne(
    @Param('id') id: string,
    @Param('supplierId') supplierId: string,
    @Session() session: UserSession,
  ) {
    return this.suppliersService.findOne(id, session.user.id, supplierId);
  }

  @Post()
  create(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(id, session.user.id, dto);
  }

  @Put(':supplierId')
  update(
    @Param('id') id: string,
    @Param('supplierId') supplierId: string,
    @Session() session: UserSession,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, session.user.id, supplierId, dto);
  }

  @Delete(':supplierId')
  remove(
    @Param('id') id: string,
    @Param('supplierId') supplierId: string,
    @Session() session: UserSession,
  ) {
    return this.suppliersService.remove(id, session.user.id, supplierId);
  }
}
