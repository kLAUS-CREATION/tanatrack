import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { FeatureType, FeatureCategory } from '../../../../generated/prisma/client';

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(FeatureType)
  type: FeatureType;

  @IsEnum(FeatureCategory)
  @IsOptional()
  category?: FeatureCategory;
}
