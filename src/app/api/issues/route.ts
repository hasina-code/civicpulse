import { createIssueSchema } from "../../../shared/validators/issue.schema";
import { requireUser } from "../../../server/permissions/guards";
import { createIssue, listIssues } from "../../../server/services/issue.service";
import { jsonSuccess, parseJsonBody, withApiErrors } from "../../../server/utils/api";
import { parseIssueQuery } from "../../../server/utils/query-parser";

export function GET(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const query = parseIssueQuery(new URL(request.url).searchParams);
    return jsonSuccess(await listIssues(actor, query));
  });
}

export function POST(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const input = await parseJsonBody(request, createIssueSchema);
    return jsonSuccess(await createIssue(actor, input), 201);
  });
}
