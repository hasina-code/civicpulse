import type { IssueCategory } from "../constants/categories";
import type { IssuePriority } from "../constants/priorities";

export interface ManagerOverview {
  departmentName: string;
  pendingTriage: number;
  activeWorkOrders: number;
  resolvedRepairs: number;
  activeCrewMembers: number;
  slaComplianceRate: number;
  queue: {
    id: string;
    title: string;
    category: IssueCategory;
    priority: IssuePriority;
    address: string;
    createdAt: string;
    location: { area: string; ward: string | null } | null;
  }[];
  crew: {
    id: string;
    name: string;
    activeWorkOrders: number;
  }[];
}
