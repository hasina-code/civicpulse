import { USER_ROLES, type UserRole } from "../../shared/constants/roles";
import {
  createUserSchema,
  updatePasswordSchema,
  updateProfileSchema,
  updateUserSchema,
} from "../../shared/validators/user.schema";
import type { PermissionUser } from "../permissions/issue.permissions";
import { AppError } from "../utils/errors";
import { createPaginatedResult, getPagination } from "../utils/pagination";
import { hashPassword, verifyPassword } from "../auth/password";
import { prisma } from "../db/prisma";

function assertAdmin(actor: PermissionUser): void {
  if (actor.role !== USER_ROLES.ADMIN) {
    throw new AppError("Only admins may manage users", 403, "FORBIDDEN");
  }
}

async function validateRoleDepartment(
  role: UserRole,
  departmentId: string | null,
) {
  if (role === USER_ROLES.MANAGER || role === USER_ROLES.STAFF) {
    if (!departmentId) {
      throw new AppError(
        "Managers and staff must belong to a department",
        400,
        "DEPARTMENT_REQUIRED",
      );
    }
    const department = await prisma.department.findFirst({
      where: { id: departmentId, isActive: true },
      select: { id: true },
    });
    if (!department) {
      throw new AppError("Active department not found", 400, "INVALID_DEPARTMENT");
    }
  } else if (departmentId) {
    throw new AppError(
      "Admins and citizens cannot be assigned to a department",
      400,
      "INVALID_DEPARTMENT",
    );
  }
}

export async function listUsers(
  actor: PermissionUser,
  input: { page?: unknown; limit?: unknown; role?: UserRole; departmentId?: string } = {},
) {
  assertAdmin(actor);
  const { page, limit, skip } = getPagination(input.page, input.limit);
  const where = {
    ...(input.role ? { role: input.role } : {}),
    ...(input.departmentId ? { departmentId: input.departmentId } : {}),
  };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  return createPaginatedResult(users, total, page, limit);
}

export async function getUserById(actor: PermissionUser, userId: string) {
  assertAdmin(actor);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
  return user;
}

export async function createUser(actor: PermissionUser, input: unknown) {
  assertAdmin(actor);
  const data = createUserSchema.parse(input);
  const departmentId = data.departmentId ?? null;
  await validateRoleDepartment(data.role, departmentId);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      phone: data.phone ?? null,
      role: data.role,
      departmentId,
      isActive: data.isActive ?? true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateUser(
  actor: PermissionUser,
  userId: string,
  input: unknown,
) {
  assertAdmin(actor);
  const data = updateUserSchema.parse(input);
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, departmentId: true },
  });
  if (!existing) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const managedDepartment = await prisma.department.findFirst({
    where: { managerId: userId },
    select: { id: true },
  });
  const role = data.role ?? existing.role;
  const departmentId =
    data.departmentId !== undefined
      ? data.departmentId
      : role === USER_ROLES.ADMIN || role === USER_ROLES.CITIZEN
        ? null
        : existing.departmentId;
  await validateRoleDepartment(role, departmentId);

  if (
    managedDepartment &&
    role === USER_ROLES.MANAGER &&
    departmentId !== managedDepartment.id
  ) {
    throw new AppError(
      "Reassign the department manager through department management",
      409,
      "MANAGED_DEPARTMENT_CONFLICT",
    );
  }

  return prisma.$transaction(async (transaction) => {
    if (managedDepartment && role !== USER_ROLES.MANAGER) {
      await transaction.department.update({
        where: { id: managedDepartment.id },
        data: { managerId: null },
      });
    }

    return transaction.user.update({
      where: { id: userId },
      data: {
        ...data,
        role,
        departmentId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
}

export async function getMe(actorId: string) {
  const user = await prisma.user.findUnique({
    where: { id: actorId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      imageUrl: true,
      role: true,
      isActive: true,
      departmentId: true,
      department: { select: { name: true } },
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
  return user;
}

export async function updateMe(actorId: string, input: unknown) {
  const data = updateProfileSchema.parse(input);
  return prisma.user.update({
    where: { id: actorId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      imageUrl: true,
      role: true,
      isActive: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateMyPassword(actorId: string, input: unknown) {
  const data = updatePasswordSchema.parse(input);
  const user = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  if (!(await verifyPassword(data.currentPassword, user.passwordHash))) {
    throw new AppError("Current password is incorrect", 400, "INVALID_PASSWORD");
  }

  await prisma.user.update({
    where: { id: actorId },
    data: { passwordHash: await hashPassword(data.newPassword) },
  });
  return { updated: true };
}
