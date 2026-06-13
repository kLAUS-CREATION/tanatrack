import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Controller('org/:id/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Param('id') id: string, @Session() session: UserSession) {
    return this.customersService.findAll(id, session.user.id);
  }

  @Get(':customerId')
  findOne(
    @Param('id') id: string,
    @Param('customerId') customerId: string,
    @Session() session: UserSession,
  ) {
    return this.customersService.findOne(id, session.user.id, customerId);
  }

  @Post()
  create(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(id, session.user.id, dto);
  }

  @Put(':customerId')
  update(
    @Param('id') id: string,
    @Param('customerId') customerId: string,
    @Session() session: UserSession,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, session.user.id, customerId, dto);
  }

  @Delete(':customerId')
  remove(
    @Param('id') id: string,
    @Param('customerId') customerId: string,
    @Session() session: UserSession,
  ) {
    return this.customersService.remove(id, session.user.id, customerId);
  }
}
