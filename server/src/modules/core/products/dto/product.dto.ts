import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductUnit } from '@prisma/client';

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  sellingPrice?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateVariantDto extends CreateVariantDto {}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsEnum(ProductUnit)
  @IsOptional()
  unit?: ProductUnit;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Optional initial variants created alongside the product.
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsEnum(ProductUnit)
  @IsOptional()
  unit?: ProductUnit;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateCategoryDto extends CreateCategoryDto {}
