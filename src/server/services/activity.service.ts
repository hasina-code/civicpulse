import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

type ActivityClient = Pick<Prisma.TransactionClient, "issue" | "issueHistory">;

export type IssueActivityType =
  | "ISSUE_CREATED"
  | "ISSUE_UPDATED"
  | "ISSUE_ASSIGNED"
  | "PRIORITY_UPDATED"
  | "TASK_REVIEWED"
  | "FEEDBACK_SUBMITTED";

export interface RecordIssueActivityInput {
  issueId: string;
  actorId: string;
  type: IssueActivityType;
  details?: string;
}

export async function recordIssueActivity(
  input: RecordIssueActivityInput,
  client: ActivityClient = prisma,
) {
  const issue = await client.issue.findUnique({
    where: { id: input.issueId },
    select: { status: true },
  });

  if (!issue) {
    throw new Error(`Cannot record activity for missing issue ${input.issueId}`);
  }

  const note = input.details
    ? `${input.type}: ${input.details}`
    : input.type;

  return client.issueHistory.create({
    data: {
      issueId: input.issueId,
      actorId: input.actorId,
      fromStatus: issue.status,
      toStatus: issue.status,
      note,
    },
  });
}
