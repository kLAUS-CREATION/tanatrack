import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseReturnItemDto {
  @IsString()
  @IsNotEmpty()
  purchaseItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePurchaseReturnDto {
  @IsString()
  @IsOptional()
  reason?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseReturnItemDto)
  items: PurchaseReturnItemDto[];
}
