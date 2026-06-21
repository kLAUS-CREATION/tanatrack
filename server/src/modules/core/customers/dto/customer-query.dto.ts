import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  PaginationQueryDto,
  type ActiveStatus,
} from 'src/common/dto/pagination.dto';

export class CustomerQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(['active', 'inactive'])
  @IsOptional()
  status?: ActiveStatus;
}
