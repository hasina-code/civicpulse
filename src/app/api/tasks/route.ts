import { z } from "zod";
import { TASK_STATUSES } from "../../../shared/constants/status";
import { paginationSchema } from "../../../shared/validators/common.schema";
import { requireUser } from "../../../server/permissions/guards";
import { listTasks } from "../../../server/services/task.service";
import { jsonSuccess, withApiErrors } from "../../../server/utils/api";

const taskQuerySchema = paginationSchema.extend({
  status: z.enum(TASK_STATUSES).optional(),
});

export function GET(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const query = taskQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return jsonSuccess(await listTasks(actor, query));
  });
}
