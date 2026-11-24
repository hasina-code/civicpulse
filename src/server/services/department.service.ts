import { USER_ROLES } from "../../shared/constants/roles";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../../shared/validators/department.schema";
import type { PermissionUser } from "../permissions/issue.permissions";
import { AppError } from "../utils/errors";
import { prisma } from "../db/prisma";

function assertAdmin(actor: PermissionUser): void {
  if (actor.role !== USER_ROLES.ADMIN) {
    throw new AppError("Only admins may manage departments", 403, "FORBIDDEN");
  }
}

async function validateDepartmentManager(
  transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  managerId: string,
  departmentId: string,
) {
  const manager = await transaction.user.findUnique({
    where: { id: managerId },
    select: { id: true, role: true, departmentId: true, isActive: true },
  });
  if (
    !manager ||
    !manager.isActive ||
    manager.role !== USER_ROLES.MANAGER ||
    (manager.departmentId && manager.departmentId !== departmentId)
  ) {
    throw new AppError(
      "Manager must be active and assigned to this department",
      400,
      "INVALID_MANAGER",
    );
  }

  const existingAssignment = await transaction.department.findFirst({
    where: { managerId, id: { not: departmentId } },
    select: { id: true },
  });
  if (existingAssignment) {
    throw new AppError(
      "A manager can only lead one department",
      409,
      "MANAGER_ALREADY_ASSIGNED",
    );
  }
}

export async function listDepartments(actor: PermissionUser) {
  const where = actor.role === USER_ROLES.ADMIN ? {} : { isActive: true };
  return prisma.department.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true, issues: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getDepartmentById(
  actor: PermissionUser,
  departmentId: string,
) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true, issues: true } },
    },
  });
  if (!department || (actor.role !== USER_ROLES.ADMIN && !department.isActive)) {
    throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  }
  return department;
}

export async function createDepartment(actor: PermissionUser, input: unknown) {
  assertAdmin(actor);
  const data = createDepartmentSchema.parse(input);

  return prisma.$transaction(async (transaction) => {
    const department = await transaction.department.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      },
    });

    if (data.managerId) {
      await validateDepartmentManager(transaction, data.managerId, department.id);
      await transaction.user.update({
        where: { id: data.managerId },
        data: { departmentId: department.id },
      });
      return transaction.department.update({
        where: { id: department.id },
        data: { managerId: data.managerId },
        include: { manager: { select: { id: true, name: true, email: true } } },
      });
    }

    return department;
  });
}

export async function updateDepartment(
  actor: PermissionUser,
  departmentId: string,
  input: unknown,
) {
  assertAdmin(actor);
  const data = updateDepartmentSchema.parse(input);

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });
    if (!existing) {
      throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    }

    if (data.managerId) {
      await validateDepartmentManager(transaction, data.managerId, departmentId);
      await transaction.user.update({
        where: { id: data.managerId },
        data: { departmentId },
      });
    }

    return transaction.department.update({
      where: { id: departmentId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.managerId !== undefined ? { managerId: data.managerId } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: { manager: { select: { id: true, name: true, email: true } } },
    });
  });
}

export async function assignDepartmentManager(
  actor: PermissionUser,
  departmentId: string,
  managerId: string | null,
) {
  assertAdmin(actor);

  return prisma.$transaction(async (transaction) => {
    const department = await transaction.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });
    if (!department) {
      throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
    }

    if (managerId) {
      await validateDepartmentManager(transaction, managerId, departmentId);
      await transaction.user.update({
        where: { id: managerId },
        data: { departmentId },
      });
    }

    return transaction.department.update({
      where: { id: departmentId },
      data: { managerId },
      include: { manager: { select: { id: true, name: true, email: true } } },
    });
  });
}
