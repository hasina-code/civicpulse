import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { TASK_STATUSES } from "../../shared/constants/status";
import { ISSUE_PRIORITIES } from "../../shared/constants/priorities";
import {
  taskCompletionSchema,
  taskProgressSchema,
  taskReviewSchema,
  updateTaskSchema,
} from "../../shared/validators/task.schema";
import { paginationSchema } from "../../shared/validators/common.schema";
import type { PermissionUser } from "../permissions/issue.permissions";
import { canReviewTask, canUpdateTask, canViewTask } from "../permissions/task.permissions";
import { AppError } from "../utils/errors";
import { createPaginatedResult, getPagination } from "../utils/pagination";
import { prisma } from "../db/prisma";
import {
  notifyIssueStatusChanged,
  notifyTaskCompleted,
  notifyTaskReviewed,
} from "./notification.service";
import { rejectTaskCompletion, transitionIssue } from "../workflow/issue-workflow";

async function ensureIssueInProgress(
  transaction: Prisma.TransactionClient,
  task: { id: string; issueId: string },
  actor: PermissionUser,
) {
  const issue = await transaction.issue.findUnique({
    where: { id: task.issueId },
    select: { status: true },
  });
  if (!issue) {
    throw new AppError("Issue not found", 404, "ISSUE_NOT_FOUND");
  }
  if (issue.status === "IN_PROGRESS") {
    return false;
  }
  if (issue.status !== "ASSIGNED") {
    throw new AppError(
      "Progress can only be added to an assigned or in-progress issue",
      400,
      "INVALID_ISSUE_STATE",
    );
  }

  await transitionIssue(
    {
      issueId: task.issueId,
      toStatus: "IN_PROGRESS",
      actor,
      taskId: task.id,
    },
    transaction,
  );
  return true;
}

const taskListQuerySchema = paginationSchema.extend({
  status: z.string().trim().min(1).optional(),
  priority: z.enum(ISSUE_PRIORITIES).optional(),
  q: z.string().trim().min(1).optional(),
  sort: z
    .string()
    .regex(/^(createdAt|updatedAt|priority|status|title):(asc|desc)$/)
    .optional(),
});

function taskScope(actor: PermissionUser) {
  if (actor.role === "ADMIN") {
    return {};
  }
  if (actor.role === "MANAGER") {
    if (!actor.departmentId) {
      throw new AppError("Manager is not assigned to a department", 403, "FORBIDDEN");
    }
    return { issue: { departmentId: actor.departmentId } };
  }
  if (actor.role === "STAFF") {
    return { assigneeId: actor.id };
  }
  throw new AppError("Citizens cannot access work orders", 403, "FORBIDDEN");
}

export async function listTasks(
  actor: PermissionUser,
  rawQuery: unknown = {},
) {
  const query = taskListQuerySchema.parse(rawQuery);
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const statuses = query.status
    ? query.status.split(",").map((status) => status.trim())
    : [];
  if (statuses.some((status) => !TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number]))) {
    throw new AppError("Invalid task status", 400, "VALIDATION_ERROR");
  }
  const scope = taskScope(actor);
  const issueScope =
    "issue" in scope
      ? scope.issue ?? {}
      : {};
  const issueFilters = {
    ...(query.priority ? { priority: query.priority } : {}),
  };
  const where = {
    ...scope,
    ...(statuses.length === 1
      ? { status: statuses[0] as (typeof TASK_STATUSES)[number] }
      : statuses.length > 1
        ? { status: { in: statuses as (typeof TASK_STATUSES)[number][] } }
        : {}),
    ...((Object.keys(issueScope).length > 0 || Object.keys(issueFilters).length > 0)
      ? { issue: { ...issueScope, ...issueFilters } }
      : {}),
    ...(query.q
      ? {
          OR: [
            { issue: { title: { contains: query.q, mode: "insensitive" as const } } },
            { issue: { address: { contains: query.q, mode: "insensitive" as const } } },
            { assignee: { name: { contains: query.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const [sortField, sortDirection] = (query.sort ?? "updatedAt:desc").split(":");
  const orderBy =
    sortField === "priority" || sortField === "status" || sortField === "title"
      ? sortField === "status"
        ? { status: sortDirection as "asc" | "desc" }
        : sortField === "priority"
          ? { issue: { priority: sortDirection as "asc" | "desc" } }
          : { issue: { title: sortDirection as "asc" | "desc" } }
      : { [sortField]: sortDirection as "asc" | "desc" };
  const [items, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      include: {
        issue: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            priority: true,
            address: true,
            latitude: true,
            longitude: true,
            departmentId: true,
          },
        },
        assignee: { select: { id: true, name: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return createPaginatedResult(items, total, page, limit);
}

export async function getTaskSummary(actor: PermissionUser) {
  const scope = taskScope(actor);
  const base = scope;

  const [pending, inProgress, awaitingReview, returned, overdue] =
    await prisma.$transaction([
      prisma.task.count({ where: { ...base, status: "PENDING" } }),
      prisma.task.count({ where: { ...base, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...base, status: "COMPLETED" } }),
      prisma.task.count({ where: { ...base, status: "REJECTED" } }),
      prisma.task.count({
        where: {
          ...base,
          status: { not: "COMPLETED" },
          dueAt: { lt: new Date() },
        },
      }),
    ]);

  return {
    pending,
    inProgress,
    awaitingReview,
    returned,
    overdue,
  };
}

export async function getTaskById(actor: PermissionUser, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      issue: {
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          priority: true,
          address: true,
          latitude: true,
          longitude: true,
          imageUrls: true,
          departmentId: true,
          status: true,
        },
      },
      updates: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!task) {
    throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
  }
  if (!canViewTask(actor, task)) {
    throw new AppError("You cannot access this task", 403, "FORBIDDEN");
  }
  return task;
}

export async function updateTask(
  actor: PermissionUser,
  taskId: string,
  input: unknown,
) {
  const data = updateTaskSchema.parse(input);
  const task = await getTaskById(actor, taskId);
  if (actor.role !== "ADMIN" && actor.role !== "MANAGER") {
    throw new AppError("Only managers or admins may update task assignment", 403, "FORBIDDEN");
  }
  if (!canUpdateTask(actor, task)) {
    throw new AppError("You cannot update this task", 403, "FORBIDDEN");
  }
  if (data.status !== undefined) {
    throw new AppError(
      "Task status changes must use progress, completion, or review actions",
      400,
      "TASK_STATUS_WORKFLOW_ONLY",
    );
  }

  if (data.assigneeId) {
    const assignee = await prisma.user.findUnique({
      where: { id: data.assigneeId },
      select: { id: true, role: true, departmentId: true, isActive: true },
    });
    if (
      !assignee ||
      !assignee.isActive ||
      assignee.role !== "STAFF" ||
      assignee.departmentId !== task.issue.departmentId
    ) {
      throw new AppError(
        "Assignee must be active staff in the issue department",
        400,
        "INVALID_ASSIGNEE",
      );
    }
  }

  return prisma.$transaction(async (transaction) => {
    const updatedTask = await transaction.task.update({
      where: { id: taskId },
      data: {
        ...(data.assigneeId ? { assigneeId: data.assigneeId } : {}),
        ...(data.dueAt !== undefined ? { dueAt: data.dueAt } : {}),
      },
    });
    if (data.assigneeId && data.assigneeId !== task.assigneeId) {
      await transaction.taskUpdate.create({
        data: {
          taskId,
          authorId: actor.id,
          note: `Task reassigned from ${task.assigneeId} to ${data.assigneeId}.`,
        },
      });
    }
    return updatedTask;
  });
}

export async function addTaskProgress(
  actor: PermissionUser,
  taskId: string,
  input: unknown,
) {
  const data = taskProgressSchema.parse(input);
  const task = await getTaskById(actor, taskId);
  if (actor.role !== "STAFF" || !canUpdateTask(actor, task)) {
    throw new AppError("Only the assigned staff member may post progress", 403, "FORBIDDEN");
  }
  if (task.issue.status !== "ASSIGNED" && task.issue.status !== "IN_PROGRESS") {
    throw new AppError("Progress cannot be added to an inactive issue", 400, "INVALID_ISSUE_STATE");
  }
  if (task.status !== "PENDING" && task.status !== "IN_PROGRESS" && task.status !== "REJECTED") {
    throw new AppError("Progress cannot be added to a completed task", 400, "INVALID_TASK_STATE");
  }

  const result = await prisma.$transaction(async (transaction) => {
    const issueStarted = await ensureIssueInProgress(transaction, task, actor);
    if (!issueStarted) {
      const changed = await transaction.task.updateMany({
        where: { id: task.id, status: task.status, assigneeId: actor.id },
        data: { status: "IN_PROGRESS" },
      });
      if (changed.count !== 1) {
        throw new AppError("Task changed while progress was being added", 409, "TASK_CONFLICT");
      }
    }

    const update = await transaction.taskUpdate.create({
      data: {
        taskId: task.id,
        authorId: actor.id,
        note: data.note,
        photoUrls: data.photoUrls,
      },
    });

    return { update, issueStarted };
  });
  if (result.issueStarted) {
    await notifyIssueStatusChanged(task.issueId, "IN_PROGRESS", actor.id);
  }
  return result.update;
}

export async function submitTaskCompletion(
  actor: PermissionUser,
  taskId: string,
  input: unknown,
) {
  const { completionPhotoUrls } = taskCompletionSchema.parse(input);
  const task = await getTaskById(actor, taskId);
  if (actor.role !== "STAFF" || task.assigneeId !== actor.id) {
    throw new AppError("Only the assigned staff member may complete this task", 403, "FORBIDDEN");
  }
  if (task.status !== "IN_PROGRESS" || task.issue.status !== "IN_PROGRESS") {
    throw new AppError("Task and issue must be in progress before completion", 400, "INVALID_TASK_STATE");
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const changed = await transaction.task.updateMany({
      where: {
        id: taskId,
        assigneeId: actor.id,
        status: "IN_PROGRESS",
      },
      data: { status: "COMPLETED", completionPhotoUrls },
    });
    if (changed.count !== 1) {
      throw new AppError("Task changed while completion was being submitted", 409, "TASK_CONFLICT");
    }

    await transaction.taskUpdate.create({
      data: {
        taskId,
        authorId: actor.id,
        note: "Task completion submitted for manager review.",
        photoUrls: completionPhotoUrls,
      },
    });
    return transaction.task.findUniqueOrThrow({ where: { id: taskId } });
  });

  await notifyTaskCompleted(taskId);
  return updated;
}

export async function reviewTask(
  actor: PermissionUser,
  taskId: string,
  input: unknown,
) {
  const review = taskReviewSchema.parse(input);
  const task = await getTaskById(actor, taskId);
  if (!canReviewTask(actor, task)) {
    throw new AppError("Only the department manager or an admin may review this task", 403, "FORBIDDEN");
  }

  if (review.decision === "APPROVE") {
    const issue = await transitionIssue({
      issueId: task.issueId,
      toStatus: "RESOLVED",
      actor,
      taskId,
      note: review.note,
    });
    await notifyTaskReviewed(taskId, "APPROVE", review.note);
    await notifyIssueStatusChanged(issue.id, issue.status, actor.id);
    return { decision: review.decision, issue };
  }

  const issue = await rejectTaskCompletion({
    issueId: task.issueId,
    taskId,
    actor,
    note: review.note ?? "",
  });
  await notifyTaskReviewed(taskId, "RETURN", review.note);
  return { decision: review.decision, issue };
}
