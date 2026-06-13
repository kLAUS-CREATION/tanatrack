import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto, UpgradePlanDto, UpdateOrganizationDto } from './dto/organization.dto';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(
    @Session() session: UserSession,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.orgService.create(session.user.id, dto);
  }

  @Get()
  async findAll(@Session() session: UserSession) {
    return this.orgService.findAllForUser(session.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.orgService.findOne(id, session.user.id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgService.update(id, session.user.id, dto);
  }

  @Put(':id/upgrade')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async upgrade(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: UpgradePlanDto,
  ) {
    return this.orgService.upgrade(id, session.user.id, dto);
  }
}
