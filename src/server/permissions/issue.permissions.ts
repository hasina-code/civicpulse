import { USER_ROLES, type UserRole } from "../../shared/constants/roles";

export interface PermissionUser {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

export interface IssuePermissionResource {
  reporterId: string;
  departmentId: string;
  tasks?: readonly { assigneeId: string }[];
}

export function canViewIssue(
  user: PermissionUser,
  issue: IssuePermissionResource,
): boolean {
  switch (user.role) {
    case USER_ROLES.ADMIN:
      return true;
    case USER_ROLES.MANAGER:
      return user.departmentId !== null && user.departmentId === issue.departmentId;
    case USER_ROLES.STAFF:
      return issue.tasks?.some((task) => task.assigneeId === user.id) ?? false;
    case USER_ROLES.CITIZEN:
      return issue.reporterId === user.id;
  }
}

export function canManageIssue(
  user: PermissionUser,
  issue: IssuePermissionResource,
): boolean {
  return (
    user.role === USER_ROLES.ADMIN ||
    (user.role === USER_ROLES.MANAGER &&
      user.departmentId !== null &&
      user.departmentId === issue.departmentId)
  );
}

export function canUpdateIssue(
  user: PermissionUser,
  issue: IssuePermissionResource,
): boolean {
  return canManageIssue(user, issue);
}
