import type { IssueCategory } from "../../shared/constants/categories";
import { ISSUE_STATUSES } from "../../shared/constants/status";
import { prisma } from "../db/prisma";
import { getBoundingBox, haversineDistanceMeters } from "./geo";

export const DEFAULT_DUPLICATE_RADIUS_METERS = 50;

const ACTIVE_ISSUE_STATUSES = ISSUE_STATUSES.filter(
  (status) => status !== "RESOLVED" && status !== "CLOSED",
);

export interface FindNearbyDuplicatesInput {
  category: IssueCategory;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  excludeIssueId?: string;
}

export async function findNearbyDuplicates({
  category,
  latitude,
  longitude,
  radiusMeters,
  excludeIssueId,
}: FindNearbyDuplicatesInput) {
  const configuredRadius =
    radiusMeters ??
    (await prisma.systemConfig.findUnique({
      where: { id: "default" },
      select: { duplicateRadiusMeters: true },
    }))?.duplicateRadiusMeters ??
    DEFAULT_DUPLICATE_RADIUS_METERS;

  const bounds = getBoundingBox({ latitude, longitude }, configuredRadius);
  const longitudeFilter = {
    OR: bounds.longitudeRanges.map((range) => ({
      longitude: { gte: range.min, lte: range.max },
    })),
  };
  const candidates = await prisma.issue.findMany({
    where: {
      category,
      status: { in: ACTIVE_ISSUE_STATUSES },
      ...(excludeIssueId ? { id: { not: excludeIssueId } } : {}),
      AND: [
        {
          latitude: {
            gte: bounds.minLatitude,
            lte: bounds.maxLatitude,
          },
        },
        longitudeFilter,
      ],
    },
    select: {
      id: true,
      title: true,
      category: true,
      priority: true,
      status: true,
      address: true,
      latitude: true,
      longitude: true,
      locationId: true,
      createdAt: true,
    },
  });

  return candidates
    .map((issue) => ({
      ...issue,
      distanceMeters: haversineDistanceMeters(
        { latitude, longitude },
        { latitude: issue.latitude, longitude: issue.longitude },
      ),
    }))
    .filter((issue) => issue.distanceMeters <= configuredRadius)
    .sort((left, right) => left.distanceMeters - right.distanceMeters);
}
