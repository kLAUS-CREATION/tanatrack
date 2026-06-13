import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { BranchService } from './branch.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Controller('org/:id/branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Get()
  async findAll(@Param('id') id: string, @Session() session: UserSession) {
    return this.branchService.findAll(id, session.user.id);
  }

  @Post()
  async create(@Param('id') id: string, @Session() session: UserSession, @Body() dto: CreateBranchDto) {
    return this.branchService.create(id, session.user.id, dto);
  }

  @Put(':branchId')
  async update(
    @Param('id') id: string,
    @Param('branchId') branchId: string,
    @Session() session: UserSession,
    @Body() dto: UpdateBranchDto
  ) {
    return this.branchService.update(id, session.user.id, branchId, dto);
  }

  @Delete(':branchId')
  async delete(
    @Param('id') id: string,
    @Param('branchId') branchId: string,
    @Session() session: UserSession
  ) {
    return this.branchService.delete(id, session.user.id, branchId);
  }
}
