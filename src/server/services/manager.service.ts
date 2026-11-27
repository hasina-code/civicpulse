import type { ManagerOverview } from "../../shared/types/manager-dashboard";
import type { PermissionUser } from "../permissions/issue.permissions";
import { AppError } from "../utils/errors";
import { prisma } from "../db/prisma";
import { getAnalyticsSummary } from "./analytics.service";

export async function getManagerOverview(
  actor: PermissionUser,
): Promise<ManagerOverview> {
  if (actor.role !== "MANAGER" || !actor.departmentId) {
    throw new AppError(
      "Manager is not assigned to a department",
      403,
      "FORBIDDEN",
    );
  }

  const department = await prisma.department.findUnique({
    where: { id: actor.departmentId },
    select: { name: true },
  });
  if (!department) {
    throw new AppError("Manager department not found", 404, "DEPARTMENT_NOT_FOUND");
  }

  const [analytics, queue, activeTaskGroups, crew] = await Promise.all([
    getAnalyticsSummary(actor),
    prisma.issue.findMany({
      where: { departmentId: actor.departmentId, status: "SUBMITTED" },
      select: {
        id: true,
        title: true,
        category: true,
        priority: true,
        address: true,
        createdAt: true,
        location: { select: { area: true, ward: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.task.groupBy({
      by: ["assigneeId"],
      where: {
        issue: { departmentId: actor.departmentId },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: {
        departmentId: actor.departmentId,
        role: "STAFF",
        isActive: true,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const tasksByAssignee = new Map(
    activeTaskGroups.map((group) => [group.assigneeId, group._count._all]),
  );
  const activeWorkOrders = activeTaskGroups.reduce(
    (total, group) => total + group._count._all,
    0,
  );

  return {
    departmentName: department.name,
    pendingTriage: analytics.byStatus.SUBMITTED,
    activeWorkOrders,
    resolvedRepairs: analytics.resolvedIssues + analytics.closedIssues,
    activeCrewMembers: crew.length,
    slaComplianceRate: analytics.slaComplianceRate,
    queue: queue.map((issue) => ({
      ...issue,
      createdAt: issue.createdAt.toISOString(),
    })),
    crew: crew.map((member) => ({
      ...member,
      activeWorkOrders: tasksByAssignee.get(member.id) ?? 0,
    })),
  };
}
