import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { BranchType } from '@prisma/client';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(BranchType)
  @IsOptional()
  type?: BranchType;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;
}

export class UpdateBranchDto extends CreateBranchDto {}
