import { ISSUE_STATUSES } from "../../shared/constants/status";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";

interface ReminderNotification {
  userId: string;
  title: string;
  message: string;
  type: "TASK_DUE_SOON" | "ISSUE_SLA_BREACH";
  link: string;
}

function slaHours(
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  config: {
    slaHoursLow: number;
    slaHoursMedium: number;
    slaHoursHigh: number;
    slaHoursCritical: number;
  },
): number {
  switch (priority) {
    case "LOW":
      return config.slaHoursLow;
    case "MEDIUM":
      return config.slaHoursMedium;
    case "HIGH":
      return config.slaHoursHigh;
    case "CRITICAL":
      return config.slaHoursCritical;
  }
}

function uniqueNotifications(notifications: ReminderNotification[]) {
  return [
    ...new Map(
      notifications.map((notification) => [
        `${notification.userId}:${notification.type}:${notification.link}`,
        notification,
      ]),
    ).values(),
  ];
}

export async function sendDueReminders(now = new Date()) {
  const config = await prisma.systemConfig.findUnique({
    where: { id: "default" },
    select: {
      slaHoursLow: true,
      slaHoursMedium: true,
      slaHoursHigh: true,
      slaHoursCritical: true,
      reminderIntervalMinutes: true,
    },
  });
  if (!config) {
    throw new AppError("System configuration is required for reminders", 500, "CONFIGURATION_ERROR");
  }

  const dueSoonAt = new Date(
    now.getTime() + config.reminderIntervalMinutes * 60 * 1000,
  );
  const activeStatuses = ISSUE_STATUSES.slice(0, 4);
  const [tasks, issues] = await Promise.all([
    prisma.task.findMany({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueAt: { gt: now, lte: dueSoonAt },
      },
      select: {
        id: true,
        assigneeId: true,
        assignedById: true,
        issue: {
          select: {
            id: true,
            title: true,
            department: { select: { managerId: true } },
          },
        },
      },
    }),
    prisma.issue.findMany({
      where: {
        status: { in: activeStatuses },
        OR: [
          {
            priority: "LOW",
            createdAt: {
              lte: new Date(now.getTime() - config.slaHoursLow * 60 * 60 * 1000),
            },
          },
          {
            priority: "MEDIUM",
            createdAt: {
              lte: new Date(now.getTime() - config.slaHoursMedium * 60 * 60 * 1000),
            },
          },
          {
            priority: "HIGH",
            createdAt: {
              lte: new Date(now.getTime() - config.slaHoursHigh * 60 * 60 * 1000),
            },
          },
          {
            priority: "CRITICAL",
            createdAt: {
              lte: new Date(now.getTime() - config.slaHoursCritical * 60 * 60 * 1000),
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        priority: true,
        createdAt: true,
        reporterId: true,
        department: { select: { managerId: true } },
      },
    }),
  ]);

  const reminders: ReminderNotification[] = [];
  for (const task of tasks) {
    const recipients = [
      {
        userId: task.assigneeId,
        link: `/staff/tasks/${task.id}`,
      },
      {
        userId: task.assignedById,
        link: `/manager/reviews`,
      },
      {
        userId: task.issue.department.managerId,
        link: `/manager/reviews`,
      },
    ].filter(
      (recipient): recipient is { userId: string; link: string } =>
        Boolean(recipient.userId),
    );
    for (const recipient of recipients) {
      reminders.push({
        userId: recipient.userId,
        title: "Work order due soon",
        message: `The due time for ${task.issue.title} is approaching.`,
        type: "TASK_DUE_SOON",
        link: recipient.link,
      });
    }
  }

  for (const issue of issues) {
    const slaDeadline =
      issue.createdAt.getTime() +
      slaHours(issue.priority, config) * 60 * 60 * 1000;
    if (slaDeadline > now.getTime()) {
      continue;
    }
    const recipients = [
      issue.department.managerId,
      issue.reporterId,
    ].filter((userId): userId is string => Boolean(userId));
    for (const userId of recipients) {
      reminders.push({
        userId,
        title: "Issue SLA exceeded",
        message: `The resolution SLA has been exceeded for ${issue.title}.`,
        type: "ISSUE_SLA_BREACH",
        link: `/issues/${issue.id}`,
      });
    }
  }

  const notifications = uniqueNotifications(reminders);
  if (notifications.length === 0) {
    return { created: 0 };
  }

  const cutoff = new Date(
    now.getTime() - config.reminderIntervalMinutes * 60 * 1000,
  );
  const existing = await prisma.notification.findMany({
    where: {
      userId: { in: notifications.map((notification) => notification.userId) },
      type: { in: ["TASK_DUE_SOON", "ISSUE_SLA_BREACH"] },
      link: { in: notifications.map((notification) => notification.link) },
      createdAt: { gte: cutoff },
    },
    select: { userId: true, type: true, link: true },
  });
  const existingKeys = new Set(
    existing.map((notification) =>
      `${notification.userId}:${notification.type}:${notification.link}`,
    ),
  );
  const missing = notifications.filter(
    (notification) =>
      !existingKeys.has(
        `${notification.userId}:${notification.type}:${notification.link}`,
      ),
  );
  if (missing.length === 0) {
    return { created: 0 };
  }

  const result = await prisma.notification.createMany({ data: missing });
  return { created: result.count };
}
