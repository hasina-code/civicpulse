import { z } from "zod";
import { TASK_STATUSES } from "../../shared/constants/status";
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

const taskListQuerySchema = paginationSchema.extend({
  status: z.enum(TASK_STATUSES).optional(),
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
  const where = {
    ...taskScope(actor),
    ...(query.status ? { status: query.status } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      include: {
        issue: {
          select: {
            id: true,
            title: true,
            status: true,
            address: true,
            latitude: true,
            longitude: true,
            departmentId: true,
          },
        },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return createPaginatedResult(items, total, page, limit);
}

export async function getTaskById(actor: PermissionUser, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      issue: { select: { id: true, departmentId: true, status: true } },
      updates: { orderBy: { createdAt: "desc" } },
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

  return prisma.$transaction(async (transaction) => {
    const changed = await transaction.task.updateMany({
      where: { id: task.id, status: task.status, assigneeId: actor.id },
      data: { status: "IN_PROGRESS" },
    });
    if (changed.count !== 1) {
      throw new AppError("Task changed while progress was being added", 409, "TASK_CONFLICT");
    }

    const update = await transaction.taskUpdate.create({
      data: {
        taskId: task.id,
        authorId: actor.id,
        note: data.note,
        photoUrls: data.photoUrls,
      },
    });

    return update;
  });
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
