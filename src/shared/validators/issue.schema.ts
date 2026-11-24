import { z } from "zod";
import { ISSUE_CATEGORIES } from "../constants/categories";
import { ISSUE_PRIORITIES } from "../constants/priorities";
import { ISSUE_STATUSES } from "../constants/status";
import {
  coordinatesSchema,
  idSchema,
  imageUrlsSchema,
  trimmedString,
} from "./common.schema";

export const createIssueSchema = z.object({
  title: trimmedString(5, 200),
  description: trimmedString(10, 5000),
  category: z.enum(ISSUE_CATEGORIES),
  priority: z.enum(ISSUE_PRIORITIES).optional(),
  imageUrls: imageUrlsSchema.default([]),
  address: trimmedString(3, 500),
  ...coordinatesSchema.shape,
  locationId: idSchema.optional(),
});

export const updateIssueSchema = createIssueSchema
  .omit({ category: true, priority: true, imageUrls: true })
  .partial()
  .extend({
    category: z.enum(ISSUE_CATEGORIES).optional(),
    priority: z.enum(ISSUE_PRIORITIES).optional(),
    imageUrls: imageUrlsSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const verifyIssueSchema = z.object({
  note: trimmedString(1, 1000).optional(),
});

export const assignIssueSchema = z.object({
  assigneeId: idSchema,
  dueAt: z.string().datetime({ offset: true }).optional(),
  note: trimmedString(1, 1000).optional(),
});

export const changeIssueStatusSchema = z.object({
  status: z.enum(ISSUE_STATUSES),
  note: trimmedString(1, 1000).optional(),
});

export const updateIssuePrioritySchema = z.object({
  priority: z.enum(ISSUE_PRIORITIES),
});

export const nearbyIssuesQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(1).max(10000).optional(),
  category: z.enum(ISSUE_CATEGORIES).optional(),
});
