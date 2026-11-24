import { issueQuerySchema } from "../../shared/validators/common.schema";

export type IssueQuery = ReturnType<typeof issueQuerySchema.parse>;

export function parseIssueQuery(
  params: URLSearchParams | Record<string, unknown>,
): IssueQuery {
  const query =
    params instanceof URLSearchParams
      ? Object.fromEntries(params.entries())
      : params;

  return issueQuerySchema.parse(query);
}
