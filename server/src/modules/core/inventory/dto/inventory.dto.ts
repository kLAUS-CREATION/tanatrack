import { IsOptional, IsString } from 'class-validator';

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

// Query for per-location stock (one of branchId/warehouseId).
export class LocationStockQueryDto extends LocationDto {}
