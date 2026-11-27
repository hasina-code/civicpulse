import { paginationSchema, trimmedString } from "../../../shared/validators/common.schema";
import { requireUser } from "../../../server/permissions/guards";
import {
  listLocations,
  searchBangladeshLocations,
} from "../../../server/services/location.service";
import { jsonSuccess, withApiErrors } from "../../../server/utils/api";

const locationQuerySchema = paginationSchema.extend({
  area: trimmedString(1, 120).optional(),
  ward: trimmedString(1, 50).optional(),
  q: trimmedString(1, 200).optional(),
});

export function GET(request: Request) {
  return withApiErrors(async () => {
    await requireUser();
    const query = locationQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const locations = await listLocations(query);
    if (locations.items.length > 0 || !query.q) {
      return jsonSuccess(locations);
    }

    const geocodedLocations = await searchBangladeshLocations(
      query.q,
      query.limit,
    );
    return jsonSuccess({
      ...locations,
      items: geocodedLocations,
      total: geocodedLocations.length,
      totalPages: geocodedLocations.length > 0 ? 1 : 0,
    });
  });
}
