import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanFeaturesDto } from './dto/plan.dto';

@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

  // Standard include object to reuse in all methods
  private planInclude = {
    planFeatures: {
      include: {
        feature: true,
      },
    },
  };

  // List all plans with full feature details
  async findAll() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      include: this.planInclude,
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Create a Plan + Optional initial features
  async create(dto: CreatePlanDto) {
    const { features, ...planData } = dto;

    return this.prisma.plan.create({
      data: {
        ...planData,
        sortOrder: planData.sortOrder ?? 0,
        planFeatures:
          features && features.length > 0
            ? {
                create: features.map((f) => ({
                  featureId: f.featureId,
                  value: f.value,
                  overrideDescription: f.overrideDescription,
                })),
              }
            : undefined,
      },
      include: this.planInclude, // Include full details in the response
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        ...this.planInclude,
        addOns: true,
      },
    });

    if (!plan) throw new NotFoundException(`Plan with ID ${id} not found`);
    return plan;
  }

  async update(id: string, dto: Partial<CreatePlanDto>) {
    const { features, ...planData } = dto;

    return this.prisma.plan.update({
      where: { id },
      data: {
        ...planData,
        sortOrder:
          planData.sortOrder !== undefined ? planData.sortOrder : undefined,
      },
      include: this.planInclude,
    });
  }

  // Sync Features: Replaces all links
  async syncFeatures(planId: string, dto: UpdatePlanFeaturesDto) {
    await this.findOne(planId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Remove all current feature assignments
      await tx.planFeature.deleteMany({ where: { planId } });

      // 2. Assign the new list
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
        include: this.planInclude,
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
