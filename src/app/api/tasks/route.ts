import { z } from "zod";
import {
  paginationSchema,
  sortSchema,
} from "../../../shared/validators/common.schema";
import { ISSUE_PRIORITIES } from "../../../shared/constants/priorities";
import { requireUser } from "../../../server/permissions/guards";
import { listTasks } from "../../../server/services/task.service";
import { jsonSuccess, withApiErrors } from "../../../server/utils/api";

const taskQuerySchema = paginationSchema.extend({
  status: z.string().trim().min(1).optional(),
  priority: z.enum(ISSUE_PRIORITIES).optional(),
  q: z.string().trim().min(1).optional(),
  sort: sortSchema.optional(),
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
