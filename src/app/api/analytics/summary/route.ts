import { requireManagerOrAdmin } from "../../../../server/permissions/guards";
import { getAnalyticsSummary } from "../../../../server/services/analytics.service";
import { jsonSuccess, withApiErrors } from "../../../../server/utils/api";

export function GET() {
  return withApiErrors(async () => {
    const actor = await requireManagerOrAdmin();
    return jsonSuccess(await getAnalyticsSummary(actor));
  });
}
