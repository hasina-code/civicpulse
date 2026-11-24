import { z } from "zod";
import { TASK_STATUSES } from "../constants/status";
import { idSchema, imageUrlsSchema, trimmedString } from "./common.schema";

export const createTaskSchema = z.object({
  issueId: idSchema,
  assigneeId: idSchema,
  dueAt: z.string().datetime({ offset: true }).optional(),
});

export const updateTaskSchema = z
  .object({
    assigneeId: idSchema.optional(),
    dueAt: z.string().datetime({ offset: true }).nullable().optional(),
    status: z.enum(TASK_STATUSES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const taskProgressSchema = z.object({
  note: trimmedString(1, 2000),
  photoUrls: imageUrlsSchema.default([]),
});

export const taskCompletionSchema = z.object({
  completionPhotoUrls: imageUrlsSchema.min(1),
});

export const taskReviewSchema = z
  .object({
    decision: z.enum(["APPROVE", "RETURN"]),
    note: trimmedString(1, 2000).optional(),
  })
  .refine((value) => value.decision !== "RETURN" || Boolean(value.note), {
    message: "A note is required when returning a task",
    path: ["note"],
  });
