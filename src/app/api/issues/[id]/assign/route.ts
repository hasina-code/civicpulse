import { z } from "zod";
import { ISSUE_PRIORITIES } from "../../../../../shared/constants/priorities";
import { assignIssueSchema } from "../../../../../shared/validators/issue.schema";
import { requireUser } from "../../../../../server/permissions/guards";
import { assignIssue } from "../../../../../server/services/issue.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../../../server/utils/api";

const assignmentSchema = assignIssueSchema.extend({
  priority: z.enum(ISSUE_PRIORITIES),
});

type RouteContext = { params: Promise<{ id: string }> };

export function POST(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const { id } = await params;
    const input = await parseJsonBody(request, assignmentSchema);
    return jsonSuccess(await assignIssue(actor, {
      issueId: id,
      assigneeId: input.assigneeId,
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
      note: input.note,
      priority: input.priority,
    }));
  });
}
