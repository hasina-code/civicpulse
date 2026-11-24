import {
  updateIssueSchema,
} from "../../../../shared/validators/issue.schema";
import { requireUser } from "../../../../server/permissions/guards";
import {
  getIssueById,
  updateIssue,
} from "../../../../server/services/issue.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../../server/utils/api";

type RouteContext = { params: Promise<{ id: string }> };

export function GET(_request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const { id } = await params;
    return jsonSuccess(await getIssueById(actor, id));
  });
}

export function PATCH(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const { id } = await params;
    const input = await parseJsonBody(request, updateIssueSchema);
    return jsonSuccess(await updateIssue(actor, id, input));
  });
}
