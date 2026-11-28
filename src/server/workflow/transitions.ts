import type { IssueStatus } from "../../shared/constants/status";
import { USER_ROLES, type UserRole } from "../../shared/constants/roles";

const managerAndAdmin = [USER_ROLES.MANAGER, USER_ROLES.ADMIN] as const;

export const ISSUE_TRANSITIONS = {
  SUBMITTED: {
    UNDER_REVIEW: managerAndAdmin,
    CLOSED: managerAndAdmin,
  },
  UNDER_REVIEW: {
    ASSIGNED: managerAndAdmin,
    CLOSED: managerAndAdmin,
  },
  ASSIGNED: {
    ASSIGNED: managerAndAdmin,
    IN_PROGRESS: [USER_ROLES.STAFF, USER_ROLES.MANAGER],
  },
  IN_PROGRESS: {
    RESOLVED: managerAndAdmin,
  },
  RESOLVED: {
    CLOSED: managerAndAdmin,
  },
  CLOSED: {},
} satisfies Record<
  IssueStatus,
  Partial<Record<IssueStatus, readonly UserRole[]>>
>;

export class IssueWorkflowError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "FORBIDDEN"
      | "INVALID_TRANSITION"
      | "INVALID_INPUT"
      | "NOT_FOUND"
      | "CONFLICT"
      | "CONFIGURATION_ERROR",
    public readonly status: 400 | 403 | 404 | 409 | 500,
  ) {
    super(message);
    this.name = "IssueWorkflowError";
  }
}

export function isTransitionAllowed(
  fromStatus: IssueStatus,
  toStatus: IssueStatus,
  role: UserRole,
): boolean {
  const transitionsFromStatus: Partial<
    Record<IssueStatus, readonly UserRole[]>
  > = ISSUE_TRANSITIONS[fromStatus];
  return transitionsFromStatus[toStatus]?.includes(role) ?? false;
}

export function assertTransitionAllowed(
  fromStatus: IssueStatus,
  toStatus: IssueStatus,
  role: UserRole,
): void {
  if (role === USER_ROLES.CITIZEN) {
    throw new IssueWorkflowError(
      "Citizens cannot change issue status",
      "FORBIDDEN",
      403,
    );
  }

  if (!isTransitionAllowed(fromStatus, toStatus, role)) {
    throw new IssueWorkflowError(
      `Transition from ${fromStatus} to ${toStatus} is not allowed for ${role}`,
      "INVALID_TRANSITION",
      400,
    );
  }
}
