import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import {
  Feature,
  FeatureType,
  FeatureCategory,
} from '../../../generated/prisma/client';

@Injectable()
export class FeaturesService {
  constructor(private prisma: PrismaService) {}

  async create(createFeatureDto: CreateFeatureDto): Promise<Feature> {
    const existing = await this.prisma.feature.findUnique({
      where: { key: createFeatureDto.key },
    });

    if (existing) {
      throw new ConflictException(
        `Feature with key "${createFeatureDto.key}" already exists`,
      );
    }

    return this.prisma.feature.create({
      data: {
        key: createFeatureDto.key,
        name: createFeatureDto.name,
        description: createFeatureDto.description,
        type: createFeatureDto.type as FeatureType,
        category: createFeatureDto.category as FeatureCategory | undefined,
      },
    });
  }

  async findAll(): Promise<Feature[]> {
    return this.prisma.feature.findMany({
      orderBy: { key: 'asc' },
    });
  }

  // Optional: get one, update, delete...
  async findOne(id: string): Promise<Feature | null> {
    return this.prisma.feature.findUnique({ where: { id } });
  }

  async update(
    id: string,
    updateDto: Partial<CreateFeatureDto>,
  ): Promise<Feature> {
    return this.prisma.feature.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string): Promise<Feature> {
    return this.prisma.feature.delete({ where: { id } });
  }
}
