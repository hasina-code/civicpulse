import { USER_ROLES } from "../../shared/constants/roles";
import { updateSystemConfigSchema } from "../../shared/validators/settings.schema";
import type { PermissionUser } from "../permissions/issue.permissions";
import { AppError } from "../utils/errors";
import { prisma } from "../db/prisma";

function assertAdmin(actor: PermissionUser): void {
  if (actor.role !== USER_ROLES.ADMIN) {
    throw new AppError("Only admins may change system settings", 403, "FORBIDDEN");
  }
}

export async function getSystemConfig() {
  return prisma.systemConfig.findUnique({ where: { id: "default" } });
}

export async function updateSystemConfig(actor: PermissionUser, input: unknown) {
  assertAdmin(actor);
  const data = updateSystemConfigSchema.parse(input);
  return prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });
}
