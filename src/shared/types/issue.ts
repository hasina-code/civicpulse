import type { IssueCategory } from "../constants/categories";
import type { IssuePriority } from "../constants/priorities";
import type { IssueStatus } from "../constants/status";

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  imageUrls: string[];
  address: string;
  latitude: number;
  longitude: number;
  locationId: string | null;
  departmentId: string;
  reporterId: string;
  duplicateOfId: string | null;
  verifiedById: string | null;
  verifiedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueHistory {
  id: string;
  issueId: string;
  actorId: string;
  fromStatus: IssueStatus | null;
  toStatus: IssueStatus;
  note: string | null;
  createdAt: Date;
}
