import { z } from "zod";
import { idSchema, trimmedString } from "./common.schema";

export const createFeedbackSchema = z.object({
  issueId: idSchema,
  rating: z.number().int().min(1).max(5),
  comment: trimmedString(1, 2000).optional(),
});
