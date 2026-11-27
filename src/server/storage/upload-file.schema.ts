import { z } from "zod";
import { MAX_IMAGE_SIZE_BYTES } from "./image-validator";

export const uploadFileSchema = z
  .custom<File>((value) => typeof File !== "undefined" && value instanceof File)
  .refine((file) => file.size > 0, "Image file must not be empty")
  .refine(
    (file) => file.size <= MAX_IMAGE_SIZE_BYTES,
    `Image file must be no larger than ${MAX_IMAGE_SIZE_BYTES} bytes`,
  );
