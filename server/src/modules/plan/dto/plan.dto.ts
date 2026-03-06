import { IsString, IsInt, IsOptional, IsBoolean, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PlanType } from 'generated/prisma/enums';

export class PlanFeatureInputDto {
  @IsString()
  featureId: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  overrideDescription?: string;
}

export class CreatePlanDto {
  @IsString() slug: string;
  @IsString() name: string;

  @IsEnum(PlanType)
  type: PlanType;

  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() badge?: string;
  @IsOptional() @IsInt() sortOrder?: number;

  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsInt() monthlyPrice?: number;
  @IsOptional() @IsInt() yearlyPrice?: number;
  @IsOptional() @IsInt() trialDays?: number;

  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureInputDto)
  features?: PlanFeatureInputDto[];
}

export class UpdatePlanFeaturesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureInputDto)
  features: PlanFeatureInputDto[];
}
