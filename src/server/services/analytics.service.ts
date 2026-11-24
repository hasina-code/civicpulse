import { z } from "zod";
import { ISSUE_CATEGORIES, type IssueCategory } from "../../shared/constants/categories";
import { ISSUE_STATUSES, type IssueStatus } from "../../shared/constants/status";
import { USER_ROLES } from "../../shared/constants/roles";
import type { PermissionUser } from "../permissions/issue.permissions";
import { AppError } from "../utils/errors";
import { prisma } from "../db/prisma";

const trendsInputSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    interval: z.enum(["day", "month"]).default("month"),
  })
  .refine(({ from, to }) => !from || !to || from <= to, {
    message: "'from' must be before or equal to 'to'",
    path: ["from"],
  });

function analyticsScope(actor: PermissionUser) {
  if (actor.role === USER_ROLES.ADMIN) {
    return {};
  }
  if (actor.role === USER_ROLES.MANAGER && actor.departmentId) {
    return { departmentId: actor.departmentId };
  }
  throw new AppError("Analytics access is restricted to managers and admins", 403, "FORBIDDEN");
}

function managerDepartmentId(actor: PermissionUser): string {
  if (actor.role !== USER_ROLES.MANAGER || !actor.departmentId) {
    throw new AppError("Manager is not assigned to a department", 403, "FORBIDDEN");
  }
  return actor.departmentId;
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

export async function getAnalyticsSummary(actor: PermissionUser) {
  const where = analyticsScope(actor);
  const [totalIssues, statusGroups, categoryGroups, resolvedIssues, config] =
    await Promise.all([
      prisma.issue.count({ where }),
      prisma.issue.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      prisma.issue.groupBy({
        by: ["category"],
        where,
        _count: { _all: true },
      }),
      prisma.issue.findMany({
        where: {
          ...where,
          status: { in: ["RESOLVED", "CLOSED"] },
          resolvedAt: { not: null },
        },
        select: { priority: true, createdAt: true, resolvedAt: true },
      }),
      prisma.systemConfig.findUnique({
        where: { id: "default" },
        select: {
          slaHoursLow: true,
          slaHoursMedium: true,
          slaHoursHigh: true,
          slaHoursCritical: true,
        },
      }),
    ]);
  if (!config) {
    throw new AppError("System configuration is required for SLA analytics", 500, "CONFIGURATION_ERROR");
  }

  const byStatus: Record<IssueStatus, number> = Object.fromEntries(
    ISSUE_STATUSES.map((status) => [status, 0]),
  ) as Record<IssueStatus, number>;
  for (const group of statusGroups) {
    byStatus[group.status] = group._count._all;
  }

  const byCategory: Record<IssueCategory, number> = Object.fromEntries(
    ISSUE_CATEGORIES.map((category) => [category, 0]),
  ) as Record<IssueCategory, number>;
  for (const group of categoryGroups) {
    byCategory[group.category] = group._count._all;
  }

  const compliantCount = resolvedIssues.filter(
    (issue) =>
      issue.resolvedAt !== null &&
      issue.resolvedAt.getTime() <=
        issue.createdAt.getTime() +
          slaHours(issue.priority, config) * 60 * 60 * 1000,
  ).length;

  return {
    totalIssues,
    openIssues:
      byStatus.SUBMITTED +
      byStatus.UNDER_REVIEW +
      byStatus.ASSIGNED +
      byStatus.IN_PROGRESS,
    resolvedIssues: byStatus.RESOLVED,
    closedIssues: byStatus.CLOSED,
    byStatus,
    byCategory,
    slaComplianceRate:
      resolvedIssues.length > 0
        ? (compliantCount / resolvedIssues.length) * 100
        : 0,
  };
}

export async function getAnalyticsTrends(
  actor: PermissionUser,
  input: unknown = {},
) {
  const { from, to, interval } = trendsInputSchema.parse(input);
  const rangeEnd = to ?? new Date();
  const rangeStart =
    from ??
    new Date(
      rangeEnd.getFullYear() - 1,
      rangeEnd.getMonth(),
      rangeEnd.getDate(),
    );
  const where = {
    ...analyticsScope(actor),
    createdAt: { gte: rangeStart, lte: rangeEnd },
  };
  const issues = await prisma.issue.findMany({
    where,
    select: { createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const grouped = new Map<string, Record<IssueStatus, number>>();
  for (const issue of issues) {
    const period =
      interval === "day"
        ? issue.createdAt.toISOString().slice(0, 10)
        : issue.createdAt.toISOString().slice(0, 7);
    const counts =
      grouped.get(period) ??
      (Object.fromEntries(ISSUE_STATUSES.map((status) => [status, 0])) as Record<
        IssueStatus,
        number
      >);
    counts[issue.status] += 1;
    grouped.set(period, counts);
  }

  return [...grouped.entries()].map(([period, byStatus]) => ({
    period,
    total: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
    byStatus,
  }));
}

export async function getDepartmentAnalytics(actor: PermissionUser) {
  const scope = analyticsScope(actor);
  const departmentWhere =
    actor.role === USER_ROLES.MANAGER
      ? { id: managerDepartmentId(actor) }
      : { isActive: true };
  const departments = await prisma.department.findMany({
    where: departmentWhere,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  if (departments.length === 0) {
    return [];
  }

  const groups = await prisma.issue.groupBy({
    by: ["departmentId", "status"],
    where: {
      ...scope,
      departmentId: { in: departments.map((department) => department.id) },
    },
    _count: { _all: true },
  });

  const countsByDepartment = new Map<
    string,
    { total: number; byStatus: Record<IssueStatus, number> }
  >();
  for (const department of departments) {
    countsByDepartment.set(department.id, {
      total: 0,
      byStatus: Object.fromEntries(
        ISSUE_STATUSES.map((status) => [status, 0]),
      ) as Record<IssueStatus, number>,
    });
  }
  for (const group of groups) {
    const counts = countsByDepartment.get(group.departmentId);
    if (counts) {
      counts.total += group._count._all;
      counts.byStatus[group.status] = group._count._all;
    }
  }

  return departments.map((department) => ({
    ...department,
    ...countsByDepartment.get(department.id)!,
  }));
}

export async function getSatisfactionAnalytics(actor: PermissionUser) {
  analyticsScope(actor);
  const feedbackWhere =
    actor.role === USER_ROLES.MANAGER
      ? { issue: { departmentId: managerDepartmentId(actor) } }
      : {};
  const [aggregate, ratingGroups] = await Promise.all([
    prisma.feedback.aggregate({
      where: feedbackWhere,
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.feedback.groupBy({
      by: ["rating"],
      where: feedbackWhere,
      _count: { _all: true },
      orderBy: { rating: "asc" },
    }),
  ]);

  return {
    averageRating: aggregate._avg.rating ?? 0,
    totalFeedback: aggregate._count._all,
    byRating: ratingGroups.map((group) => ({
      rating: group.rating,
      count: group._count._all,
    })),
  };
}
