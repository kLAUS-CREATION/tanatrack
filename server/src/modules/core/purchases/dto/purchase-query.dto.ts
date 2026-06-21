import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';

export class PurchaseQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  // Filter by supplier display name (linked supplier name or free-text name).
  @IsString()
  @IsOptional()
  supplier?: string;

  // ISO date bounds on createdAt (inclusive of the whole `to` day).
  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;
}
