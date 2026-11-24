import { z } from "zod";
import { ISSUE_CATEGORIES } from "../constants/categories";
import { ISSUE_PRIORITIES } from "../constants/priorities";
import { ISSUE_STATUSES } from "../constants/status";

export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);

export const coordinatesSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const isoDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Must be a valid ISO date",
});

export const sortSchema = z
  .string()
  .regex(/^(createdAt|updatedAt|priority|status|title):(asc|desc)$/);

export const issueQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1).optional(),
  status: z.enum(ISSUE_STATUSES).optional(),
  priority: z.enum(ISSUE_PRIORITIES).optional(),
  category: z.enum(ISSUE_CATEGORIES).optional(),
  departmentId: z.string().trim().min(1).optional(),
  locationId: z.string().trim().min(1).optional(),
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  sort: sortSchema.optional(),
}).refine(
  ({ from, to }) => !from || !to || Date.parse(from) <= Date.parse(to),
  { message: "'from' must be before or equal to 'to'", path: ["from"] },
);

export const trimmedString = (minLength = 1, maxLength = 500) =>
  z.string().trim().min(minLength).max(maxLength);

export const idSchema = trimmedString(1, 191);

export const urlOrLocalPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => value.startsWith("/") || z.url().safeParse(value).success, {
    message: "Must be a valid URL or local path",
  });

export const imageUrlsSchema = z.array(urlOrLocalPathSchema).max(10);
