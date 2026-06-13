import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { BillingInterval } from '@prisma/client';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsEnum(BillingInterval)
  @IsOptional()
  billingInterval: BillingInterval = BillingInterval.MONTHLY;
}

export class UpgradePlanDto {
  @IsString()
  @IsNotEmpty()
  newPlanId: string;
}

/** Owner-only edit of core organization info. */
export class UpdateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  timeZone?: string;
}
