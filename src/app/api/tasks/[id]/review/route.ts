import { taskReviewSchema } from "../../../../../shared/validators/task.schema";
import { requireUser } from "../../../../../server/permissions/guards";
import { reviewTask } from "../../../../../server/services/task.service";
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
    const input = await parseJsonBody(request, taskReviewSchema);
    return jsonSuccess(await reviewTask(actor, id, input));
  });
}
