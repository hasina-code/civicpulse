import { requireUser } from "../../../../../server/permissions/guards";
import { getIssueHistory } from "../../../../../server/services/activity.service";
import { jsonSuccess, withApiErrors } from "../../../../../server/utils/api";

type RouteContext = { params: Promise<{ id: string }> };

export function GET(_request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const { id } = await params;
    return jsonSuccess(await getIssueHistory(actor, id));
  });
}
