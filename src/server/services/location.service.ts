import { paginationSchema, trimmedString } from "../../shared/validators/common.schema";
import { z } from "zod";
import { AppError } from "../utils/errors";
import { createPaginatedResult, getPagination } from "../utils/pagination";
import { prisma } from "../db/prisma";

const geocodingResultSchema = z.array(
  z.object({
    place_id: z.union([z.string(), z.number()]),
    display_name: z.string().min(1),
    lat: z.string(),
    lon: z.string(),
  }),
);

let geocodingRequestQueue: Promise<void> = Promise.resolve();
let lastGeocodingRequestAt = 0;

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

function requestGeocodingService(url: URL): Promise<Response> {
  const request = geocodingRequestQueue.then(async () => {
    const wait = Math.max(0, 1000 - (Date.now() - lastGeocodingRequestAt));
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }

    lastGeocodingRequestAt = Date.now();
    return fetch(url, {
      headers: {
        "User-Agent":
          "CivicPulse/0.1.0 (https://github.com/hasina-code/civicpulse)",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
  });
  geocodingRequestQueue = request.then(
    () => undefined,
    () => undefined,
  );
  return request;
}

export async function searchBangladeshLocations(query: string, limit: number) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "bd");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("accept-language", "bn,en");
  url.searchParams.set("q", query);

  let response: Response;
  try {
    response = await requestGeocodingService(url);
  } catch {
    throw new AppError(
      "Location search is temporarily unavailable. Please try again.",
      502,
      "LOCATION_SEARCH_UNAVAILABLE",
    );
  }

  if (!response.ok) {
    throw new AppError(
      "Location search is temporarily unavailable. Please try again.",
      502,
      "LOCATION_SEARCH_UNAVAILABLE",
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AppError(
      "Location search returned an invalid response.",
      502,
      "INVALID_LOCATION_SEARCH_RESPONSE",
    );
  }

  const results = geocodingResultSchema.safeParse(payload);
  if (!results.success) {
    throw new AppError(
      "Location search returned an invalid response.",
      502,
      "INVALID_LOCATION_SEARCH_RESPONSE",
    );
  }

  return results.data
    .map((result) => ({
      id: `osm-${result.place_id}`,
      name: result.display_name.split(",")[0].trim(),
      area: "",
      ward: null,
      address: result.display_name,
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      source: "openstreetmap" as const,
    }))
    .filter(
      (location) =>
        Number.isFinite(location.latitude) &&
        Number.isFinite(location.longitude) &&
        location.latitude >= 20.5 &&
        location.latitude <= 26.8 &&
        location.longitude >= 88 &&
        location.longitude <= 92.8,
    )
    .slice(0, limit);
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
