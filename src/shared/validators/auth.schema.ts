import { z } from "zod";
import { trimmedString } from "./common.schema";

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(8).max(128);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const citizenRegistrationSchema = z.object({
  name: trimmedString(2, 100),
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().trim().max(30).optional(),
});
