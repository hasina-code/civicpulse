import type { IssuePriority } from "../../shared/constants/priorities";
import { USER_ROLES } from "../../shared/constants/roles";
import type { IssueStatus, TaskStatus } from "../../shared/constants/status";
import { prisma } from "../db/prisma";
import {
  assertTransitionAllowed,
  IssueWorkflowError,
} from "./transitions";

export interface WorkflowActor {
  id: string;
  role: "ADMIN" | "MANAGER" | "STAFF" | "CITIZEN";
  departmentId: string | null;
}

export type IssueCloseReason = "CANCELLED" | "INVALID" | "DUPLICATE";

export interface TransitionIssueInput {
  issueId: string;
  toStatus: IssueStatus;
  actor: WorkflowActor;
  note?: string;
  priority?: IssuePriority;
  assigneeId?: string;
  dueAt?: Date | null;
  taskId?: string;
  closeReason?: IssueCloseReason;
  duplicateOfId?: string;
}

function assertDepartmentAccess(
  actor: WorkflowActor,
  departmentId: string,
): void {
  if (
    actor.role === USER_ROLES.MANAGER &&
    actor.departmentId !== departmentId
  ) {
    throw new IssueWorkflowError(
      "Managers may only act on issues in their own department",
      "FORBIDDEN",
      403,
    );
  }
}

function requireNote(note: string | undefined, message: string): string {
  const normalizedNote = note?.trim();
  if (!normalizedNote) {
    throw new IssueWorkflowError(message, "INVALID_INPUT", 400);
  }
  return normalizedNote;
}

export async function transitionIssue(input: TransitionIssueInput) {
  return prisma.$transaction(async (transaction) => {
    const issue = await transaction.issue.findUnique({
      where: { id: input.issueId },
      select: {
        id: true,
        status: true,
        priority: true,
        departmentId: true,
      },
    });

    if (!issue) {
      throw new IssueWorkflowError("Issue not found", "NOT_FOUND", 404);
    }

    assertTransitionAllowed(issue.status, input.toStatus, input.actor.role);
    assertDepartmentAccess(input.actor, issue.departmentId);

    let taskToUpdate:
      | { id: string; status: TaskStatus; assigneeId: string }
      | undefined;
    let assignment:
      | { assigneeId: string; dueAt: Date | null }
      | undefined;
    let historyNote = input.note?.trim() || null;
    let duplicateOfId: string | undefined;
    let verifiedAt: Date | undefined;
    let resolvedAt: Date | undefined;
    let priority: IssuePriority | undefined;

    if (input.toStatus === "UNDER_REVIEW") {
      verifiedAt = new Date();
    }

    if (input.toStatus === "ASSIGNED") {
      if (!input.priority || !input.assigneeId) {
        throw new IssueWorkflowError(
          "Priority and staff assignment are required",
          "INVALID_INPUT",
          400,
        );
      }

      const assignee = await transaction.user.findUnique({
        where: { id: input.assigneeId },
        select: {
          id: true,
          role: true,
          departmentId: true,
          isActive: true,
        },
      });

      if (
        !assignee ||
        !assignee.isActive ||
        assignee.role !== USER_ROLES.STAFF ||
        assignee.departmentId !== issue.departmentId
      ) {
        throw new IssueWorkflowError(
          "The assignee must be an active staff member of the issue department",
          "INVALID_INPUT",
          400,
        );
      }

      assignment = {
        assigneeId: assignee.id,
        dueAt: input.dueAt ?? null,
      };
      priority = input.priority;
    }

    if (input.toStatus === "IN_PROGRESS") {
      if (!input.taskId) {
        throw new IssueWorkflowError(
          "A task is required to start work on an issue",
          "INVALID_INPUT",
          400,
        );
      }

      const task = await transaction.task.findFirst({
        where: { id: input.taskId, issueId: issue.id },
        select: { id: true, status: true, assigneeId: true },
      });

      if (!task) {
        throw new IssueWorkflowError(
          "Task not found for this issue",
          "NOT_FOUND",
          404,
        );
      }

      if (input.actor.role === USER_ROLES.STAFF) {
        if (
          task.assigneeId !== input.actor.id ||
          (task.status !== "PENDING" && task.status !== "IN_PROGRESS")
        ) {
          throw new IssueWorkflowError(
            "Staff may only start their own pending task",
            "FORBIDDEN",
            403,
          );
        }
        taskToUpdate = task;
      } else if (
        input.actor.role !== USER_ROLES.MANAGER ||
        task.status !== "IN_PROGRESS"
      ) {
        throw new IssueWorkflowError(
          "A manager may transition the issue after its assigned staff member starts the task",
          "INVALID_TRANSITION",
          400,
        );
      }
    }

    if (input.toStatus === "RESOLVED") {
      if (!input.taskId) {
        throw new IssueWorkflowError(
          "A completed task is required to resolve an issue",
          "INVALID_INPUT",
          400,
        );
      }

      const completedTask = await transaction.task.findFirst({
        where: {
          id: input.taskId,
          issueId: issue.id,
          status: "COMPLETED",
        },
        select: { id: true },
      });

      if (!completedTask) {
        throw new IssueWorkflowError(
          "The issue can only be resolved after its task is completed",
          "INVALID_TRANSITION",
          400,
        );
      }

      resolvedAt = new Date();
    }

    if (input.toStatus === "CLOSED") {
      if (issue.status === "RESOLVED") {
        const feedback = await transaction.feedback.findUnique({
          where: { issueId: issue.id },
          select: { id: true },
        });

        if (!feedback) {
          throw new IssueWorkflowError(
            "A resolved issue can be manually closed after citizen feedback is submitted",
            "INVALID_TRANSITION",
            400,
          );
        }
      } else {
        historyNote = requireNote(
          input.note,
          "A reason is required when cancelling or invalidating an issue",
        );

        if (!input.closeReason) {
          throw new IssueWorkflowError(
            "A close reason is required",
            "INVALID_INPUT",
            400,
          );
        }

        if (input.closeReason === "DUPLICATE") {
          if (!input.duplicateOfId || input.duplicateOfId === issue.id) {
            throw new IssueWorkflowError(
              "A different issue must be selected as the duplicate target",
              "INVALID_INPUT",
              400,
            );
          }

          const duplicateTarget = await transaction.issue.findUnique({
            where: { id: input.duplicateOfId },
            select: { id: true },
          });
          if (!duplicateTarget) {
            throw new IssueWorkflowError(
              "Duplicate target issue not found",
              "NOT_FOUND",
              404,
            );
          }
          duplicateOfId = duplicateTarget.id;
        }

        historyNote = `[${input.closeReason}] ${historyNote}`;
      }
    }

    const changed = await transaction.issue.updateMany({
      where: { id: issue.id, status: issue.status },
      data: {
        status: input.toStatus,
        ...(priority ? { priority } : {}),
        ...(verifiedAt
          ? { verifiedAt, verifiedById: input.actor.id }
          : {}),
        ...(resolvedAt ? { resolvedAt } : {}),
        ...(duplicateOfId ? { duplicateOfId } : {}),
      },
    });

    if (changed.count !== 1) {
      throw new IssueWorkflowError(
        "Issue status changed while this transition was being processed",
        "CONFLICT",
        409,
      );
    }

    if (assignment) {
      await transaction.task.create({
        data: {
          issueId: issue.id,
          assigneeId: assignment.assigneeId,
          assignedById: input.actor.id,
          dueAt: assignment.dueAt,
        },
      });
    }

    if (taskToUpdate) {
      const taskChanged = await transaction.task.updateMany({
        where: {
          id: taskToUpdate.id,
          issueId: issue.id,
          assigneeId: input.actor.id,
          status: taskToUpdate.status,
        },
        data: { status: "IN_PROGRESS" },
      });

      if (taskChanged.count !== 1) {
        throw new IssueWorkflowError(
          "Task status changed while work was being started",
          "CONFLICT",
          409,
        );
      }
    }

    await transaction.issueHistory.create({
      data: {
        issueId: issue.id,
        actorId: input.actor.id,
        fromStatus: issue.status,
        toStatus: input.toStatus,
        note: historyNote,
      },
    });

    const updatedIssue = await transaction.issue.findUnique({
      where: { id: issue.id },
    });

    if (!updatedIssue) {
      throw new IssueWorkflowError("Issue not found", "NOT_FOUND", 404);
    }

    return updatedIssue;
  });
}

export interface RejectTaskCompletionInput {
  issueId: string;
  taskId: string;
  actor: WorkflowActor;
  note: string;
}

export async function rejectTaskCompletion(
  input: RejectTaskCompletionInput,
) {
  const note = requireNote(input.note, "A note is required when returning work");

  return prisma.$transaction(async (transaction) => {
    const issue = await transaction.issue.findUnique({
      where: { id: input.issueId },
      select: { id: true, status: true, departmentId: true },
    });

    if (!issue) {
      throw new IssueWorkflowError("Issue not found", "NOT_FOUND", 404);
    }
    if (
      input.actor.role !== USER_ROLES.ADMIN &&
      input.actor.role !== USER_ROLES.MANAGER
    ) {
      throw new IssueWorkflowError(
        "Only a manager or admin may review task completion",
        "FORBIDDEN",
        403,
      );
    }
    assertDepartmentAccess(input.actor, issue.departmentId);

    if (issue.status !== "IN_PROGRESS") {
      throw new IssueWorkflowError(
        "Only an in-progress issue can have its completed task returned",
        "INVALID_TRANSITION",
        400,
      );
    }

    const task = await transaction.task.findFirst({
      where: {
        id: input.taskId,
        issueId: issue.id,
        status: "COMPLETED",
      },
      select: { id: true },
    });

    if (!task) {
      throw new IssueWorkflowError(
        "Completed task not found for this issue",
        "NOT_FOUND",
        404,
      );
    }

    const taskChanged = await transaction.task.updateMany({
      where: {
        id: task.id,
        issueId: issue.id,
        status: "COMPLETED",
      },
      data: {
        status: "REJECTED",
        reviewNote: note,
      },
    });

    if (taskChanged.count !== 1) {
      throw new IssueWorkflowError(
        "Task status changed while the review was being processed",
        "CONFLICT",
        409,
      );
    }

    await transaction.issueHistory.create({
      data: {
        issueId: issue.id,
        actorId: input.actor.id,
        fromStatus: issue.status,
        toStatus: issue.status,
        note: `Completion returned: ${note}`,
      },
    });

    return transaction.issue.findUniqueOrThrow({ where: { id: issue.id } });
  });
}

export interface AutoCloseResolvedIssueInput {
  issueId: string;
  automationActorId: string;
  now?: Date;
}

export async function autoCloseResolvedIssue(
  input: AutoCloseResolvedIssueInput,
) {
  const now = input.now ?? new Date();

  return prisma.$transaction(async (transaction) => {
    const issue = await transaction.issue.findUnique({
      where: { id: input.issueId },
      select: {
        id: true,
        status: true,
        priority: true,
        resolvedAt: true,
      },
    });

    if (!issue) {
      throw new IssueWorkflowError("Issue not found", "NOT_FOUND", 404);
    }
    if (issue.status !== "RESOLVED" || !issue.resolvedAt) {
      throw new IssueWorkflowError(
        "Only a resolved issue can be closed by SLA",
        "INVALID_TRANSITION",
        400,
      );
    }

    const [config, automationActor] = await Promise.all([
      transaction.systemConfig.findUnique({
        where: { id: "default" },
        select: {
          slaHoursLow: true,
          slaHoursMedium: true,
          slaHoursHigh: true,
          slaHoursCritical: true,
        },
      }),
      transaction.user.findUnique({
        where: { id: input.automationActorId },
        select: { id: true, role: true, isActive: true },
      }),
    ]);

    if (!config) {
      throw new IssueWorkflowError(
        "System configuration is required for SLA auto-close",
        "CONFIGURATION_ERROR",
        500,
      );
    }
    if (
      !automationActor ||
      automationActor.role !== USER_ROLES.ADMIN ||
      !automationActor.isActive
    ) {
      throw new IssueWorkflowError(
        "SLA auto-close requires an active admin audit actor",
        "FORBIDDEN",
        403,
      );
    }

    const slaHoursByPriority: Record<IssuePriority, number> = {
      LOW: config.slaHoursLow,
      MEDIUM: config.slaHoursMedium,
      HIGH: config.slaHoursHigh,
      CRITICAL: config.slaHoursCritical,
    };
    const closeAfter =
      issue.resolvedAt.getTime() +
      slaHoursByPriority[issue.priority] * 60 * 60 * 1000;

    if (now.getTime() < closeAfter) {
      throw new IssueWorkflowError(
        "The issue has not reached its SLA auto-close time",
        "INVALID_TRANSITION",
        400,
      );
    }

    const changed = await transaction.issue.updateMany({
      where: { id: issue.id, status: "RESOLVED" },
      data: { status: "CLOSED" },
    });

    if (changed.count !== 1) {
      throw new IssueWorkflowError(
        "Issue status changed while SLA auto-close was being processed",
        "CONFLICT",
        409,
      );
    }

    await transaction.issueHistory.create({
      data: {
        issueId: issue.id,
        actorId: automationActor.id,
        fromStatus: "RESOLVED",
        toStatus: "CLOSED",
        note: "Automatically closed after the priority-based SLA period elapsed.",
      },
    });

    return transaction.issue.findUniqueOrThrow({ where: { id: issue.id } });
  });
}
