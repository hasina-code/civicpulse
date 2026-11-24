import { nearbyIssuesQuerySchema } from "../../../../shared/validators/issue.schema";
import { requireUser } from "../../../../server/permissions/guards";
import { findNearbyIssues } from "../../../../server/services/issue.service";
import { jsonSuccess, withApiErrors } from "../../../../server/utils/api";

export function GET(request: Request) {
  return withApiErrors(async () => {
    await requireUser();
    const query = nearbyIssuesQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return jsonSuccess(
      await findNearbyIssues({
        latitude: query.latitude,
        longitude: query.longitude,
        category: query.category,
        radiusMeters: query.radius,
      }),
    );
  });
}
