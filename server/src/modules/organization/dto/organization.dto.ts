import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { BillingInterval } from 'generated/prisma/enums';

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
