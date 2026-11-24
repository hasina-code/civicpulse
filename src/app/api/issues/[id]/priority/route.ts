import { updateIssuePrioritySchema } from "../../../../../shared/validators/issue.schema";
import { requireUser } from "../../../../../server/permissions/guards";
import { updateIssuePriority } from "../../../../../server/services/issue.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../../../server/utils/api";

type RouteContext = { params: Promise<{ id: string }> };

export function PATCH(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const { id } = await params;
    const input = await parseJsonBody(request, updateIssuePrioritySchema);
    return jsonSuccess(await updateIssuePriority(actor, id, input));
  });
}
