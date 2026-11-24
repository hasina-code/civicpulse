import { z } from "zod";
import { requireManagerOrAdmin } from "../../../../server/permissions/guards";
import { getAnalyticsTrends } from "../../../../server/services/analytics.service";
import { jsonSuccess, withApiErrors } from "../../../../server/utils/api";

const trendsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  interval: z.enum(["day", "month"]).default("month"),
});

export function GET(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireManagerOrAdmin();
    const query = trendsQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return jsonSuccess(await getAnalyticsTrends(actor, query));
  });
}
