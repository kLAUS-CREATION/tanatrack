import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseItemDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  // Cost paid per unit (minor units). Defaults to the variant's costPrice if omitted.
  @IsInt()
  @Min(0)
  @IsOptional()
  unitCost?: number;

  // Expiry date (ISO) for this received lot. Required when the product is
  // perishable (enforced in the service); ignored for non-perishables.
  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

// Purchases receive stock into the org-wide receiving pool (no location); it is
// allocated to a branch/warehouse later via the Allocations flow.
export class CreatePurchaseDto {
  // Optional link to a saved supplier; free-text supplierName still supported.
  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  supplierName?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
