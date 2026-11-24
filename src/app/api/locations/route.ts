import { paginationSchema, trimmedString } from "../../../shared/validators/common.schema";
import { requireUser } from "../../../server/permissions/guards";
import { listLocations } from "../../../server/services/location.service";
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
    return jsonSuccess(await listLocations(query));
  });
}
