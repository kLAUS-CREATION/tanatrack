import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';

@Controller('org/:id/warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  async findAll(@Param('id') id: string, @Session() session: UserSession) {
    return this.warehouseService.findAll(id, session.user.id);
  }

  @Post()
  async create(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.warehouseService.create(id, session.user.id, dto);
  }

  @Put(':warehouseId')
  async update(
    @Param('id') id: string,
    @Param('warehouseId') warehouseId: string,
    @Session() session: UserSession,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.warehouseService.update(id, session.user.id, warehouseId, dto);
  }

  @Delete(':warehouseId')
  async delete(
    @Param('id') id: string,
    @Param('warehouseId') warehouseId: string,
    @Session() session: UserSession,
  ) {
    return this.warehouseService.delete(id, session.user.id, warehouseId);
  }
}
