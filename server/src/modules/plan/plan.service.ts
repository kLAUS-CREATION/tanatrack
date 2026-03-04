import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanFeaturesDto } from './dto/plan.dto';

@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

  // List all plans with their features (Used for Pricing Pages)
  async findAll() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      include: {
        planFeatures: {
          include: { feature: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Create a Plan + Optional initial features
  async create(dto: CreatePlanDto) {
    const { features, ...planData } = dto;

    return this.prisma.plan.create({
      data: {
        ...planData,
        planFeatures: {
          create: features?.map((f) => ({
            featureId: f.featureId,
            value: f.value,
            overrideDescription: f.overrideDescription,
          })),
        },
      },
      include: { planFeatures: true },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        planFeatures: {
          include: { feature: true },
        },
        addOns: true,
      },
    });

    if (!plan) throw new NotFoundException(`Plan with ID ${id} not found`);
    return plan;
  }

  async update(id: string, dto: Partial<CreatePlanDto>) {
    const { features, ...planData } = dto;

    // We only update the Plan basic info here.
    // Features are handled by the specific sync endpoint below.
    return this.prisma.plan.update({
      where: { id },
      data: planData,
    });
  }

  // Sync Features: This deletes old plan links and creates new ones
  async syncFeatures(planId: string, dto: UpdatePlanFeaturesDto) {
    await this.findOne(planId); // Verify plan exists

    return this.prisma.$transaction(async (tx) => {
      // 1. Remove all current feature assignments
      await tx.planFeature.deleteMany({ where: { planId } });

      // 2. Assign the new list of features and values
      return tx.plan.update({
        where: { id: planId },
        data: {
          planFeatures: {
            create: dto.features.map((f) => ({
              featureId: f.featureId,
              value: f.value,
              overrideDescription: f.overrideDescription,
            })),
          },
        },
        include: { planFeatures: true },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Usually better to soft-delete by setting isActive: false
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
