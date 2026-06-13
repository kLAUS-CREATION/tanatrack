import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// A single location: exactly one of branchId / warehouseId must be set
// (enforced in the service layer, like InviteLocation).
export class LocationDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;
}

export class PurchaseInDto extends LocationDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  reference?: string;
}

export class AdjustStockDto extends LocationDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  // Absolute target quantity at the location after the correction.
  @IsInt()
  @Min(0)
  quantity: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  reorderPoint?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class TransferStockDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @ValidateNested()
  @Type(() => LocationDto)
  from: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  to: LocationDto;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  reference?: string;
}

// Query for per-location stock (one of branchId/warehouseId).
export class LocationStockQueryDto extends LocationDto {}
