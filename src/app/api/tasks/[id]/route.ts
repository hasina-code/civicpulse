import { updateTaskSchema } from "../../../../shared/validators/task.schema";
import { requireUser } from "../../../../server/permissions/guards";
import { getTaskById, updateTask } from "../../../../server/services/task.service";
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
    return jsonSuccess(await getTaskById(actor, id));
  });
}

export function PATCH(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const { id } = await params;
    const input = await parseJsonBody(request, updateTaskSchema);
    return jsonSuccess(await updateTask(actor, id, input));
  });
}
