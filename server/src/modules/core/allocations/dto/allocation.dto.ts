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
