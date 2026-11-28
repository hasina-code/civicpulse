import { requireUser } from "../../../../server/permissions/guards";
import { getTaskSummary } from "../../../../server/services/task.service";
import { jsonSuccess, withApiErrors } from "../../../../server/utils/api";

export function GET() {
  return withApiErrors(async () => {
    const actor = await requireUser();
    return jsonSuccess(await getTaskSummary(actor));
  });
}
