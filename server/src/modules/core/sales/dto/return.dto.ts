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

export class ReturnItemDto {
  @IsString()
  @IsNotEmpty()
  saleItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateReturnDto {
  @IsString()
  @IsOptional()
  reason?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
}
