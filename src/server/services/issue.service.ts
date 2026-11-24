import { ISSUE_CATEGORIES, CATEGORY_DEPARTMENT_MAP } from "../../shared/constants/categories";
import { USER_ROLES, type UserRole } from "../../shared/constants/roles";
import { ISSUE_STATUSES } from "../../shared/constants/status";
import {
  createIssueSchema,
  updateIssuePrioritySchema,
  updateIssueSchema,
} from "../../shared/validators/issue.schema";
import type { PermissionUser } from "../permissions/issue.permissions";
import { canManageIssue, canUpdateIssue, canViewIssue } from "../permissions/issue.permissions";
import { AppError } from "../utils/errors";
import { findNearbyDuplicates } from "../utils/duplicate";
import { getPagination, createPaginatedResult } from "../utils/pagination";
import { parseIssueQuery } from "../utils/query-parser";
import { prisma } from "../db/prisma";
import { notifyIssueStatusChanged, notifyTaskAssigned } from "./notification.service";
import { recordIssueActivity } from "./activity.service";
import { transitionIssue, type TransitionIssueInput, type WorkflowActor } from "../workflow/issue-workflow";

const issueListSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  priority: true,
  status: true,
  imageUrls: true,
  address: true,
  latitude: true,
  longitude: true,
  locationId: true,
  departmentId: true,
  reporterId: true,
  duplicateOfId: true,
  verifiedById: true,
  verifiedAt: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true } },
  location: { select: { id: true, name: true, area: true, ward: true } },
} as const;

function assertRole(actor: PermissionUser, roles: readonly UserRole[]): void {
  if (!roles.includes(actor.role)) {
    throw new AppError("Insufficient permissions", 403, "FORBIDDEN");
  }
}

function toWorkflowActor(actor: PermissionUser): WorkflowActor {
  return actor;
}

function issueScope(actor: PermissionUser) {
  switch (actor.role) {
    case USER_ROLES.ADMIN:
      return {};
    case USER_ROLES.MANAGER:
      if (!actor.departmentId) {
        throw new AppError("Manager is not assigned to a department", 403, "FORBIDDEN");
      }
      return { departmentId: actor.departmentId };
    case USER_ROLES.STAFF:
      return { tasks: { some: { assigneeId: actor.id } } };
    case USER_ROLES.CITIZEN:
      return { reporterId: actor.id };
  }
}

function parseSort(sort: string | undefined) {
  const [field, direction] = (sort ?? "createdAt:desc").split(":");
  if (!["createdAt", "updatedAt", "priority", "status", "title"].includes(field)) {
    throw new AppError("Unsupported issue sort field", 400, "INVALID_SORT");
  }
  return { [field]: direction as "asc" | "desc" };
}

function dateRange(from?: string, to?: string) {
  if (!from && !to) {
    return undefined;
  }

  const endDate =
    to && /^\d{4}-\d{2}-\d{2}$/.test(to)
      ? new Date(`${to}T23:59:59.999Z`)
      : to
        ? new Date(to)
        : undefined;

  return {
    ...(from ? { gte: new Date(from) } : {}),
    ...(endDate ? { lte: endDate } : {}),
  };
}

export async function listIssues(
  actor: PermissionUser,
  rawQuery: URLSearchParams | Record<string, unknown> = {},
) {
  const query = parseIssueQuery(rawQuery);
  if (
    actor.role === USER_ROLES.MANAGER &&
    query.departmentId &&
    query.departmentId !== actor.departmentId
  ) {
    throw new AppError("Managers may only query their own department", 403, "FORBIDDEN");
  }
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const createdAt = dateRange(query.from, query.to);
  const where = {
    ...issueScope(actor),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" as const } },
            { address: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...(query.locationId ? { locationId: query.locationId } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...issueScope(actor),
  };

  const [items, total] = await prisma.$transaction([
    prisma.issue.findMany({
      where,
      select: issueListSelect,
      orderBy: parseSort(query.sort),
      skip,
      take: limit,
    }),
    prisma.issue.count({ where }),
  ]);

  return createPaginatedResult(items, total, page, limit);
}

export async function getIssueById(actor: PermissionUser, issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { tasks: { select: { assigneeId: true } } },
  });
  if (!issue) {
    throw new AppError("Issue not found", 404, "ISSUE_NOT_FOUND");
  }
  if (!canViewIssue(actor, issue)) {
    throw new AppError("You cannot access this issue", 403, "FORBIDDEN");
  }
  return issue;
}

export async function createIssue(actor: PermissionUser, input: unknown) {
  assertRole(actor, [USER_ROLES.CITIZEN]);
  const data = createIssueSchema.parse(input);
  const departmentName = CATEGORY_DEPARTMENT_MAP[data.category];
  const department = await prisma.department.findUnique({
    where: { name: departmentName },
    select: { id: true },
  });
  if (!department) {
    throw new AppError(
      `No department is configured for ${data.category}`,
      500,
      "DEPARTMENT_CONFIGURATION_ERROR",
    );
  }

  const nearbyDuplicates = await findNearbyDuplicates({
    category: data.category,
    latitude: data.latitude,
    longitude: data.longitude,
  });
  const duplicateOfId = nearbyDuplicates[0]?.id;

  const issue = await prisma.$transaction(async (transaction) => {
    const createdIssue = await transaction.issue.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority ?? "MEDIUM",
        imageUrls: data.imageUrls,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        locationId: data.locationId,
        departmentId: department.id,
        reporterId: actor.id,
        duplicateOfId,
      },
      select: issueListSelect,
    });

    await transaction.issueHistory.create({
      data: {
        issueId: createdIssue.id,
        actorId: actor.id,
        fromStatus: null,
        toStatus: "SUBMITTED",
        note: duplicateOfId
          ? `Issue submitted; possible duplicate of ${duplicateOfId}.`
          : "Issue submitted by a citizen.",
      },
    });

    return createdIssue;
  });

  await notifyIssueStatusChanged(issue.id, issue.status, actor.id);
  return { issue, possibleDuplicate: Boolean(duplicateOfId), duplicateOfId: duplicateOfId ?? null };
}

export async function updateIssue(
  actor: PermissionUser,
  issueId: string,
  input: unknown,
) {
  const data = updateIssueSchema.parse(input);
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { tasks: { select: { assigneeId: true } } },
  });
  if (!issue) {
    throw new AppError("Issue not found", 404, "ISSUE_NOT_FOUND");
  }
  if (!canUpdateIssue(actor, issue)) {
    throw new AppError("You cannot update this issue", 403, "FORBIDDEN");
  }

  let departmentId: string | undefined;
  if (data.category && data.category !== issue.category) {
    const departmentName = CATEGORY_DEPARTMENT_MAP[data.category];
    const department = await prisma.department.findUnique({
      where: { name: departmentName },
      select: { id: true },
    });
    if (!department) {
      throw new AppError(
        `No department is configured for ${data.category}`,
        500,
        "DEPARTMENT_CONFIGURATION_ERROR",
      );
    }
    if (
      actor.role === USER_ROLES.MANAGER &&
      department.id !== issue.departmentId
    ) {
      throw new AppError(
        "Managers cannot reroute an issue outside their department",
        403,
        "FORBIDDEN",
      );
    }
    departmentId = department.id;
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const savedIssue = await transaction.issue.update({
      where: { id: issueId },
      data: { ...data, ...(departmentId ? { departmentId } : {}) },
      select: issueListSelect,
    });
    await recordIssueActivity(
      {
        issueId,
        actorId: actor.id,
        type: "ISSUE_UPDATED",
        details: `Updated ${Object.keys(data).join(", ")}`,
      },
      transaction,
    );
    return savedIssue;
  });
  await notifyIssueStatusChanged(issueId, updated.status, actor.id);
  return updated;
}

export function verifyIssue(
  actor: PermissionUser,
  issueId: string,
  note?: string,
) {
  return changeIssueStatus(actor, {
    issueId,
    toStatus: "UNDER_REVIEW",
    note,
  });
}

export function assignIssue(
  actor: PermissionUser,
  input: Pick<TransitionIssueInput, "issueId" | "assigneeId" | "priority" | "dueAt" | "note">,
) {
  return changeIssueStatus(actor, {
    ...input,
    toStatus: "ASSIGNED",
  });
}

export async function updateIssuePriority(
  actor: PermissionUser,
  issueId: string,
  input: unknown,
) {
  assertRole(actor, [USER_ROLES.MANAGER, USER_ROLES.ADMIN]);
  const { priority } = updateIssuePrioritySchema.parse(input);
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { tasks: { select: { assigneeId: true } } },
  });
  if (!issue) {
    throw new AppError("Issue not found", 404, "ISSUE_NOT_FOUND");
  }
  if (!canManageIssue(actor, issue)) {
    throw new AppError("You cannot manage this issue", 403, "FORBIDDEN");
  }
  if (!ISSUE_STATUSES.slice(0, 4).includes(issue.status)) {
    throw new AppError("Priority cannot be changed after resolution", 400, "INVALID_ISSUE_STATE");
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const savedIssue = await transaction.issue.update({
      where: { id: issueId },
      data: { priority },
      select: issueListSelect,
    });
    await recordIssueActivity(
      {
        issueId,
        actorId: actor.id,
        type: "PRIORITY_UPDATED",
        details: priority,
      },
      transaction,
    );
    return savedIssue;
  });
  await notifyIssueStatusChanged(issueId, updated.status, actor.id);
  return updated;
}

export async function changeIssueStatus(
  actor: PermissionUser,
  input: Omit<TransitionIssueInput, "actor">,
) {
  const issue = await transitionIssue({
    ...input,
    actor: toWorkflowActor(actor),
  });
  await notifyIssueStatusChanged(issue.id, issue.status, actor.id);
  if (input.toStatus === "ASSIGNED") {
    const task = await prisma.task.findFirst({
      where: { issueId: issue.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, assigneeId: true },
    });
    if (!task) {
      throw new AppError("Assignment task was not created", 500, "TASK_CREATION_FAILED");
    }
    await recordIssueActivity({
      issueId: issue.id,
      actorId: actor.id,
      type: "ISSUE_ASSIGNED",
      details: `Task ${task.id} assigned to ${task.assigneeId}`,
    });
    await notifyTaskAssigned(task.id);
  }
  return issue;
}

export async function findNearbyIssues(input: {
  category: (typeof ISSUE_CATEGORIES)[number];
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  excludeIssueId?: string;
}) {
  return findNearbyDuplicates(input);
}

