import type { UserRole } from "../../shared/constants/roles";
import { getCurrentSession } from "../auth/session";
import type { PermissionUser } from "./issue.permissions";

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireUser(): Promise<PermissionUser> {
  const session = await getCurrentSession();
  const user = session?.user;

  if (!user?.id) {
    throw new AuthorizationError("Authentication required", 401);
  }

  return {
    id: user.id,
    role: user.role,
    departmentId: user.departmentId,
  };
}

export async function requireRole(...allowedRoles: UserRole[]): Promise<PermissionUser> {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError("Insufficient permissions", 403);
  }

  return user;
}

export function requireAdmin(): Promise<PermissionUser> {
  return requireRole("ADMIN");
}

export function requireManagerOrAdmin(): Promise<PermissionUser> {
  return requireRole("MANAGER", "ADMIN");
}
