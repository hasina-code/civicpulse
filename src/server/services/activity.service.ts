import type { Prisma } from "@prisma/client";
import type { PermissionUser } from "../permissions/issue.permissions";
import { canViewIssue } from "../permissions/issue.permissions";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";

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

export async function getIssueHistory(
  actor: PermissionUser,
  issueId: string,
) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { tasks: { select: { assigneeId: true } } },
  });
  if (!issue) {
    throw new AppError("Issue not found", 404, "ISSUE_NOT_FOUND");
  }
  if (!canViewIssue(actor, issue)) {
    throw new AppError("You cannot access this issue history", 403, "FORBIDDEN");
  }

  return prisma.issueHistory.findMany({
    where: { issueId },
    include: { actor: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
}
