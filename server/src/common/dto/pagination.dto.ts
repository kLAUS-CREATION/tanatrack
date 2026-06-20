import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Active/inactive filter for soft-deletable resources. */
export type ActiveStatus = 'active' | 'inactive';

/**
 * Prisma `isActive` filter for a status param. Default (undefined) preserves the
 * "active only" behavior; 'inactive' surfaces soft-deleted rows on demand.
 */
export function activeWhere(status?: ActiveStatus): { isActive: boolean } {
  return { isActive: status === 'inactive' ? false : true };
}

/**
 * Like {@link activeWhere} but the default (undefined) returns no filter at all —
 * for resources whose list shows both active and inactive rows by default.
 */
export function optionalActiveWhere(status?: ActiveStatus): {
  isActive?: boolean;
} {
  if (!status) return {};
  return { isActive: status === 'active' };
}

/** Standard offset pagination query params, shared by all list endpoints. */
export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 25;
}

/** A page of results plus the total count of matching rows (pre-pagination). */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Normalize page/pageSize into prisma skip/take plus the echoed page meta. */
export function resolvePaging(query: PaginationQueryDto): {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
} {
  const page = query.page && query.page > 0 ? query.page : 1;
  const pageSize =
    query.pageSize && query.pageSize > 0 ? Math.min(query.pageSize, 100) : 25;
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}
