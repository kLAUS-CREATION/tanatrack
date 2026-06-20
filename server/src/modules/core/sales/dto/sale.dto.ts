import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class SaleItemDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  // Defaults to the variant's sellingPrice if omitted.
  @IsInt()
  @Min(0)
  @IsOptional()
  unitPrice?: number;
}

export class CreateSaleDto {
  @IsString()
  @IsNotEmpty()
  branchId: string;

  // Optional link to a saved customer; free-text name/phone still supported.
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  // Order-level discount in minor units, applied before tax. Defaults to 0.
  @IsInt()
  @Min(0)
  @IsOptional()
  discount?: number;

  // Tax in minor units (e.g. computed VAT). Defaults to 0.
  @IsInt()
  @Min(0)
  @IsOptional()
  tax?: number;

  // Tender from the mock payment gateway. When omitted the sale is UNPAID.
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  // Amount tendered in minor units. Drives paymentStatus (PAID/PARTIAL/UNPAID).
  @IsInt()
  @Min(0)
  @IsOptional()
  amountPaid?: number;

  // Mock gateway transaction reference.
  @IsString()
  @IsOptional()
  paymentRef?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
