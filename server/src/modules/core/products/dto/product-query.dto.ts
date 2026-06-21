import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  PaginationQueryDto,
  type ActiveStatus,
} from 'src/common/dto/pagination.dto';

export class ProductQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  // A category id, or the literal 'none' to match uncategorized products.
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsIn(['active', 'inactive'])
  @IsOptional()
  status?: ActiveStatus;
}
