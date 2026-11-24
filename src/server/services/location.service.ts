import { paginationSchema, trimmedString } from "../../shared/validators/common.schema";
import { AppError } from "../utils/errors";
import { createPaginatedResult, getPagination } from "../utils/pagination";
import { prisma } from "../db/prisma";

const locationQuerySchema = paginationSchema.extend({
  area: trimmedString(1, 120).optional(),
  ward: trimmedString(1, 50).optional(),
  q: trimmedString(1, 200).optional(),
});

export async function listLocations(input: unknown = {}) {
  const query = locationQuerySchema.parse(input);
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const where = {
    ...(query.area ? { area: { equals: query.area, mode: "insensitive" as const } } : {}),
    ...(query.ward ? { ward: query.ward } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { address: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [locations, total] = await prisma.$transaction([
    prisma.location.findMany({
      where,
      orderBy: [{ area: "asc" }, { name: "asc" }],
      skip,
      take: limit,
    }),
    prisma.location.count({ where }),
  ]);

  return createPaginatedResult(locations, total, page, limit);
}

export async function getLocationById(locationId: string) {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
  });
  if (!location) {
    throw new AppError("Location not found", 404, "LOCATION_NOT_FOUND");
  }
  return location;
}
