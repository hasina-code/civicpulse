import { z } from "zod";
import { idSchema, trimmedString } from "./common.schema";

export const createDepartmentSchema = z.object({
  name: trimmedString(2, 120),
  description: trimmedString(1, 1000).nullable().optional(),
  managerId: idSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateDepartmentSchema = z
  .object({
    name: trimmedString(2, 120).optional(),
    description: trimmedString(1, 1000).nullable().optional(),
    managerId: idSchema.nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const assignDepartmentManagerSchema = z.object({
  managerId: idSchema.nullable(),
});
