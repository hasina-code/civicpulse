import { requireRole } from "../../../../server/permissions/guards";
import { getManagerOverview } from "../../../../server/services/manager.service";
import { jsonSuccess, withApiErrors } from "../../../../server/utils/api";

export function GET() {
  return withApiErrors(async () => {
    const actor = await requireRole("MANAGER");
    return jsonSuccess(await getManagerOverview(actor));
  });
}
