import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

// Move received (pool) stock to a destination location.
// Destination: exactly one of branchId / warehouseId (service-enforced).
export class CreateAllocationDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  reference?: string;
}

// Write off all expired units of a perishable variant at one location (or the
// receiving pool when no location is given). Runs through the same maker-checker
// engine as allocations (STOCK_MOVE change requests).
export class WriteOffExpiredDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

// Move stock between two locations. Source and destination each take exactly
// one of branchId / warehouseId (service-enforced) and must differ. Runs through
// the same maker-checker engine as allocations (STOCK_MOVE change requests).
export class CreateTransferDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  fromBranchId?: string;

  @IsString()
  @IsOptional()
  fromWarehouseId?: string;

  @IsString()
  @IsOptional()
  toBranchId?: string;

  @IsString()
  @IsOptional()
  toWarehouseId?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  reference?: string;
}
