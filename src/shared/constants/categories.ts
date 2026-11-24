export const ISSUE_CATEGORIES = [
  "ROAD_DAMAGE",
  "STREETLIGHT",
  "DRAINAGE",
  "FOOTPATH",
  "WASTE_MANAGEMENT",
  "PUBLIC_INFRASTRUCTURE",
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  ROAD_DAMAGE: "Road Damage",
  STREETLIGHT: "Streetlight",
  DRAINAGE: "Drainage",
  FOOTPATH: "Footpath",
  WASTE_MANAGEMENT: "Waste Management",
  PUBLIC_INFRASTRUCTURE: "Public Infrastructure",
};

export const CATEGORY_DEPARTMENT_MAP: Record<IssueCategory, string> = {
  ROAD_DAMAGE: "Roads & Highways",
  STREETLIGHT: "Electricity & Lighting",
  DRAINAGE: "Water & Sewage",
  FOOTPATH: "Roads & Highways",
  WASTE_MANAGEMENT: "Waste Management",
  PUBLIC_INFRASTRUCTURE: "Parks & Public Spaces",
};
