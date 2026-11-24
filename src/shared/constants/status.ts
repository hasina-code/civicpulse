export const ISSUE_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const TASK_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
