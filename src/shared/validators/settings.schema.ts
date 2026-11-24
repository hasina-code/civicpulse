import { z } from "zod";

export const updateSystemConfigSchema = z
  .object({
    slaHoursLow: z.number().int().min(1).max(87600).optional(),
    slaHoursMedium: z.number().int().min(1).max(87600).optional(),
    slaHoursHigh: z.number().int().min(1).max(87600).optional(),
    slaHoursCritical: z.number().int().min(1).max(87600).optional(),
    duplicateRadiusMeters: z.number().int().min(1).max(10000).optional(),
    dispatchPolicy: z.enum(["CATEGORY", "NEAREST", "WORKLOAD"]).optional(),
    reminderIntervalMinutes: z.number().int().min(1).max(10080).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });
