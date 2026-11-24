import type { IssueStatus } from "../../shared/constants/status";
import type { PaginatedResult } from "../../shared/types/api";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import { createPaginatedResult, getPagination } from "../utils/pagination";

export interface NotificationQuery {
  page?: unknown;
  limit?: unknown;
  since?: Date;
}

export async function listNotifications(
  userId: string,
  query: NotificationQuery = {},
): Promise<PaginatedResult<{
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}>> {
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const where = {
    userId,
    ...(query.since ? { createdAt: { gt: query.since } } : {}),
  };
  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        link: true,
        readAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);
  return createPaginatedResult(notifications, total, page, limit);
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
) {
  const changed = await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
  if (changed.count === 0) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
    }
    return notification;
  }

  return prisma.notification.findUniqueOrThrow({
    where: { id: notificationId },
  });
}

interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}

async function createNotifications(notifications: NotificationInput[]) {
  const uniqueNotifications = [
    ...new Map(
      notifications.map((notification) => [
        `${notification.userId}:${notification.type}:${notification.link ?? ""}`,
        notification,
      ]),
    ).values(),
  ];

  if (uniqueNotifications.length === 0) {
    return;
  }

  await prisma.notification.createMany({ data: uniqueNotifications });
}

export async function notifyIssueStatusChanged(
  issueId: string,
  status: IssueStatus,
  actorId?: string,
) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      title: true,
      reporterId: true,
      department: { select: { managerId: true } },
    },
  });
  if (!issue) {
    throw new Error(`Cannot notify about missing issue ${issueId}`);
  }

  const recipients = [
    issue.reporterId,
    issue.department.managerId,
  ].filter((userId): userId is string => Boolean(userId && userId !== actorId));

  await createNotifications(
    recipients.map((userId) => ({
      userId,
      title: "Issue status updated",
      message: `${issue.title} is now ${status.toLowerCase().replace(/_/g, " ")}.`,
      type: "ISSUE_STATUS",
      link: `/issues/${issueId}`,
    })),
  );
}

export async function notifyTaskAssigned(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      assigneeId: true,
      issue: {
        select: {
          id: true,
          title: true,
          reporterId: true,
          department: { select: { managerId: true } },
        },
      },
    },
  });
  if (!task) {
    throw new Error(`Cannot notify about missing task ${taskId}`);
  }

  const recipients = [
    task.assigneeId,
    task.issue.department.managerId,
    task.issue.reporterId,
  ].filter((userId): userId is string => Boolean(userId));

  await createNotifications(
    recipients.map((userId) => ({
      userId,
      title: "Work order assigned",
      message: `A work order was assigned for ${task.issue.title}.`,
      type: "TASK_ASSIGNED",
      link: `/issues/${task.issue.id}`,
    })),
  );
}

export async function notifyTaskReviewed(
  taskId: string,
  decision: "APPROVE" | "RETURN",
  note?: string,
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      assigneeId: true,
      issue: { select: { id: true, title: true, reporterId: true } },
    },
  });
  if (!task) {
    throw new Error(`Cannot notify about missing task ${taskId}`);
  }

  const message =
    decision === "APPROVE"
      ? `Work for ${task.issue.title} was approved.`
      : `Work for ${task.issue.title} was returned for revision.${note ? ` ${note}` : ""}`;

  await createNotifications([
    {
      userId: task.assigneeId,
      title: decision === "APPROVE" ? "Work approved" : "Work returned",
      message,
      type: "TASK_REVIEW",
      link: `/staff/tasks/${taskId}`,
    },
    {
      userId: task.issue.reporterId,
      title: "Issue review updated",
      message,
      type: "TASK_REVIEW",
      link: `/issues/${task.issue.id}`,
    },
  ]);
}

export async function notifyTaskCompleted(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      issue: {
        select: {
          id: true,
          title: true,
          department: { select: { managerId: true } },
        },
      },
    },
  });
  if (!task) {
    throw new Error(`Cannot notify about missing task ${taskId}`);
  }

  const managerId = task.issue.department.managerId;
  if (!managerId) {
    return;
  }

  await createNotifications([
    {
      userId: managerId,
      title: "Work ready for review",
      message: `Completed work for ${task.issue.title} is ready for review.`,
      type: "TASK_COMPLETED",
      link: `/manager/reviews`,
    },
  ]);
}

export async function notifyFeedbackSubmitted(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      title: true,
      department: { select: { managerId: true } },
      tasks: { select: { assigneeId: true } },
    },
  });
  if (!issue) {
    throw new Error(`Cannot notify about missing issue ${issueId}`);
  }

  const recipients = [
    issue.department.managerId,
    ...issue.tasks.map((task) => task.assigneeId),
  ].filter((userId): userId is string => Boolean(userId));

  await createNotifications(
    recipients.map((userId) => ({
      userId,
      title: "Citizen feedback received",
      message: `Feedback was submitted for ${issue.title}.`,
      type: "FEEDBACK",
      link: `/issues/${issueId}`,
    })),
  );
}
