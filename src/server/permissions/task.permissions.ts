import { USER_ROLES } from "../../shared/constants/roles";
import type { PermissionUser } from "./issue.permissions";

export interface TaskPermissionResource {
  assigneeId: string;
  issue: { departmentId: string };
}

export function canViewTask(
  user: PermissionUser,
  task: TaskPermissionResource,
): boolean {
  switch (user.role) {
    case USER_ROLES.ADMIN:
      return true;
    case USER_ROLES.MANAGER:
      return (
        user.departmentId !== null &&
        user.departmentId === task.issue.departmentId
      );
    case USER_ROLES.STAFF:
      return task.assigneeId === user.id;
    case USER_ROLES.CITIZEN:
      return false;
  }
}

export function canUpdateTask(
  user: PermissionUser,
  task: TaskPermissionResource,
): boolean {
  return (
    user.role === USER_ROLES.ADMIN ||
    (user.role === USER_ROLES.MANAGER &&
      user.departmentId !== null &&
      user.departmentId === task.issue.departmentId) ||
    (user.role === USER_ROLES.STAFF && task.assigneeId === user.id)
  );
}

export function canReviewTask(
  user: PermissionUser,
  task: TaskPermissionResource,
): boolean {
  return (
    user.role === USER_ROLES.ADMIN ||
    (user.role === USER_ROLES.MANAGER &&
      user.departmentId !== null &&
      user.departmentId === task.issue.departmentId)
  );
}
