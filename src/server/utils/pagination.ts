import type { PaginatedResult } from "../../shared/types/api";
import { paginationSchema } from "../../shared/validators/common.schema";

export function getPagination(page?: unknown, limit?: unknown) {
  const parsed = paginationSchema.parse({ page, limit });

  return {
    page: parsed.page,
    limit: parsed.limit,
    skip: (parsed.page - 1) * parsed.limit,
    take: parsed.limit,
  };
}

export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  if (!Number.isInteger(total) || total < 0) {
    throw new RangeError("Total must be a non-negative integer");
  }

  const pagination = paginationSchema.parse({ page, limit: pageSize });

  return {
    items,
    page: pagination.page,
    pageSize: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit),
  };
}
