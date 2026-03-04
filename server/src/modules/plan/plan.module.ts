import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlanController } from './plan.controller';

@Module({
  providers: [PlanService, PrismaService],
  controllers: [PlanController]
})
export class PlanModule {}
