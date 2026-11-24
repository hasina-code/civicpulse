export const ISSUE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];
