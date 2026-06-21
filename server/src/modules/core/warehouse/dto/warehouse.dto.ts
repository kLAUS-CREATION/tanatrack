import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateWarehouseDto extends CreateWarehouseDto {}
