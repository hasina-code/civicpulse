import { z } from "zod";
import {
  taskCompletionSchema,
  taskProgressSchema,
} from "../../../../../shared/validators/task.schema";
import { requireUser } from "../../../../../server/permissions/guards";
import {
  addTaskProgress,
  submitTaskCompletion,
} from "../../../../../server/services/task.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../../../server/utils/api";

const taskUpdateActionSchema = z.discriminatedUnion("action", [
  taskProgressSchema.extend({ action: z.literal("PROGRESS") }),
  taskCompletionSchema.extend({ action: z.literal("COMPLETE") }),
]);

type RouteContext = { params: Promise<{ id: string }> };

export function POST(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const { id } = await params;
    const input = await parseJsonBody(request, taskUpdateActionSchema);
    if (input.action === "PROGRESS") {
      return jsonSuccess(
        await addTaskProgress(actor, id, taskProgressSchema.parse(input)),
        201,
      );
    }

    return jsonSuccess(
      await submitTaskCompletion(actor, id, taskCompletionSchema.parse(input)),
    );
  });
}
