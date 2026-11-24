import { USER_ROLES } from "../../shared/constants/roles";
import { createFeedbackSchema } from "../../shared/validators/feedback.schema";
import type { PermissionUser } from "../permissions/issue.permissions";
import { AppError } from "../utils/errors";
import { prisma } from "../db/prisma";
import { notifyFeedbackSubmitted } from "./notification.service";
import { recordIssueActivity } from "./activity.service";

export async function createFeedback(actor: PermissionUser, input: unknown) {
  if (actor.role !== USER_ROLES.CITIZEN) {
    throw new AppError("Only citizens may submit feedback", 403, "FORBIDDEN");
  }
  const data = createFeedbackSchema.parse(input);
  const issue = await prisma.issue.findUnique({
    where: { id: data.issueId },
    select: {
      id: true,
      reporterId: true,
      status: true,
    },
  });
  if (!issue) {
    throw new AppError("Issue not found", 404, "ISSUE_NOT_FOUND");
  }
  if (issue.reporterId !== actor.id) {
    throw new AppError("You may only review your own issue", 403, "FORBIDDEN");
  }
  if (issue.status !== "RESOLVED" && issue.status !== "CLOSED") {
    throw new AppError("Feedback is available after an issue is resolved", 400, "ISSUE_NOT_RESOLVED");
  }

  const feedback = await prisma.$transaction(async (transaction) => {
    const createdFeedback = await transaction.feedback.create({
      data: {
        issueId: issue.id,
        reporterId: actor.id,
        rating: data.rating,
        comment: data.comment ?? null,
      },
    });
    await recordIssueActivity(
      {
        issueId: issue.id,
        actorId: actor.id,
        type: "FEEDBACK_SUBMITTED",
        details: `Rating ${data.rating}/5`,
      },
      transaction,
    );
    return createdFeedback;
  });
  await notifyFeedbackSubmitted(issue.id);
  return feedback;
}

export async function getFeedbackForIssue(
  actor: PermissionUser,
  issueId: string,
) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      reporterId: true,
      departmentId: true,
      feedback: true,
    },
  });
  if (!issue) {
    throw new AppError("Issue not found", 404, "ISSUE_NOT_FOUND");
  }
  const canAccess =
    actor.role === USER_ROLES.ADMIN ||
    actor.id === issue.reporterId ||
    (actor.role === USER_ROLES.MANAGER &&
      actor.departmentId === issue.departmentId);
  if (!canAccess) {
    throw new AppError("You cannot access this feedback", 403, "FORBIDDEN");
  }
  return issue.feedback;
}
