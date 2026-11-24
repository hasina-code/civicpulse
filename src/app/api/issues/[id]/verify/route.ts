import { verifyIssueSchema } from "../../../../../shared/validators/issue.schema";
import { requireUser } from "../../../../../server/permissions/guards";
import { verifyIssue } from "../../../../../server/services/issue.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../../../server/utils/api";

type RouteContext = { params: Promise<{ id: string }> };

export function POST(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const { id } = await params;
    const input = await parseJsonBody(request, verifyIssueSchema);
    return jsonSuccess(await verifyIssue(actor, id, input.note));
  });
}
