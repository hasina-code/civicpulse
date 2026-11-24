import { z } from "zod";
import { requireUser } from "../../../server/permissions/guards";
import { uploadImage } from "../../../server/storage";
import { MAX_IMAGE_SIZE_BYTES } from "../../../server/storage/image-validator";
import { AppError } from "../../../server/utils/errors";
import { jsonSuccess, withApiErrors } from "../../../server/utils/api";

const uploadFileSchema = z
  .custom<File>((value) => typeof File !== "undefined" && value instanceof File)
  .refine((file) => file.size > 0, "Image file must not be empty")
  .refine(
    (file) => file.size <= MAX_IMAGE_SIZE_BYTES,
    `Image file must be no larger than ${MAX_IMAGE_SIZE_BYTES} bytes`,
  );

const uploadRequestSchema = z.object({ file: uploadFileSchema });

export function POST(request: Request) {
  return withApiErrors(async () => {
    await requireUser();
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new AppError("Request must be multipart form data", 400, "INVALID_FORM_DATA");
    }
    const { file } = uploadRequestSchema.parse({ file: formData.get("file") });
    const stored = await uploadImage({
      buffer: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
    });
    return jsonSuccess(stored, 201);
  });
}
