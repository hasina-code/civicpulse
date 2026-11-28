import { AboutSection } from "@/client/components/landing/about-section";
import { CallToAction } from "../../client/components/landing/CallToAction";
import { CategoryGrid } from "../../client/components/landing/CategoryGrid";
import { CityRadarPreview } from "../../client/components/landing/CityRadarPreview";
import { ComparisonTable } from "../../client/components/landing/ComparisonTable";
import { ExecutiveInsights } from "../../client/components/landing/ExecutiveInsights";
import { HeroBanner } from "../../client/components/landing/HeroBanner";
import { HowItWorks } from "../../client/components/landing/HowItWorks";

import { RoleEcosystem } from "../../client/components/landing/RoleEcosystem";
import { StatusTimelineDemo } from "../../client/components/landing/StatusTimelineDemo";
import { FeaturesSection } from "@/client/components/landing/features-section";
import { prisma } from "../../server/db/prisma";
import { ISSUE_CATEGORY_LABELS } from "../../shared/constants/categories";
import type { IssueCategory } from "../../shared/constants/categories";
import type { IssueStatus } from "../../shared/constants/status";

type RadarStatus = "REPORTED" | "IN_PROGRESS" | "RESOLVED";

function relativeTime(date: Date) {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function radarStatus(status: IssueStatus): RadarStatus {
  if (status === "RESOLVED" || status === "CLOSED") return "RESOLVED";
  if (status === "ASSIGNED" || status === "IN_PROGRESS") return "IN_PROGRESS";
  return "REPORTED";
}

export default async function HomePage() {
  const issues = await prisma.issue.findMany({
    take: 12,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      address: true,
      latitude: true,
      longitude: true,
      updatedAt: true,
      department: { select: { name: true } },
      location: { select: { area: true, ward: true } },
    },
  });

  const positions = [
    [28, 34], [64, 26], [52, 66], [76, 58], [34, 72],
    [82, 32], [18, 58], [44, 22], [68, 78], [22, 28],
    [58, 48], [88, 68],
  ];

  const radarPins = issues.map((issue, index) => ({
    id: issue.id,
    code: `CP-${issue.id.slice(-4).toUpperCase()}`,
    title: issue.title,
    category: ISSUE_CATEGORY_LABELS[issue.category as IssueCategory],
    location: issue.location
      ? `${issue.location.area}${issue.location.ward ? `, Ward ${issue.location.ward}` : ""}`
      : issue.address,
    status: radarStatus(issue.status),
    updatedAt: relativeTime(issue.updatedAt),
    department: issue.department.name,
    x: positions[index][0],
    y: positions[index][1],
  }));

  return (
    <>
      <HeroBanner />
      <AboutSection />
      <CategoryGrid />
      <HowItWorks />
      <CityRadarPreview radarPins={radarPins} />
      <FeaturesSection/>
      <RoleEcosystem />
      <StatusTimelineDemo />
      <ExecutiveInsights />
      <ComparisonTable />
      <CallToAction />
    </>
  );
}
