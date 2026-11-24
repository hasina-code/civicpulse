import { z } from "zod";
import { USER_ROLES } from "../constants/roles";
import { idSchema, trimmedString } from "./common.schema";

const emailSchema = z.string().trim().email().max(254);
const phoneSchema = z.string().trim().max(30).nullable().optional();

export const createUserSchema = z.object({
  name: trimmedString(2, 100),
  email: emailSchema,
  password: z.string().min(8).max(128),
  phone: phoneSchema,
  role: z.enum(USER_ROLES),
  departmentId: idSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z
  .object({
    name: trimmedString(2, 100).optional(),
    email: emailSchema.optional(),
    phone: phoneSchema,
    role: z.enum(USER_ROLES).optional(),
    departmentId: idSchema.nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const updateProfileSchema = z.object({
  name: trimmedString(2, 100).optional(),
  phone: phoneSchema,
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided",
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must differ from the current password",
    path: ["newPassword"],
  });
