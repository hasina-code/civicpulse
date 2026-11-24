import { z } from "zod";
import { ISSUE_STATUSES } from "../../../../../shared/constants/status";
import { ISSUE_PRIORITIES } from "../../../../../shared/constants/priorities";
import { idSchema, trimmedString } from "../../../../../shared/validators/common.schema";
import { requireUser } from "../../../../../server/permissions/guards";
import { changeIssueStatus } from "../../../../../server/services/issue.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../../../server/utils/api";

const issueStatusActionSchema = z.object({
  status: z.enum(ISSUE_STATUSES),
  note: trimmedString(1, 1000).optional(),
  priority: z.enum(ISSUE_PRIORITIES).optional(),
  assigneeId: idSchema.optional(),
  dueAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)).nullable().optional(),
  taskId: idSchema.optional(),
  closeReason: z.enum(["CANCELLED", "INVALID", "DUPLICATE"]).optional(),
  duplicateOfId: idSchema.optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export function POST(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const { id } = await params;
    const input = await parseJsonBody(request, issueStatusActionSchema);
    return jsonSuccess(await changeIssueStatus(actor, {
      issueId: id,
      toStatus: input.status,
      note: input.note,
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueAt: input.dueAt,
      taskId: input.taskId,
      closeReason: input.closeReason,
      duplicateOfId: input.duplicateOfId,
    }));
  });
}
