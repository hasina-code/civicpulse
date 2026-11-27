import { requireUser } from "../../../server/permissions/guards";
import { uploadImage } from "../../../server/storage";
import { uploadFileSchema } from "../../../server/storage/upload-file.schema";
import { AppError } from "../../../server/utils/errors";
import { jsonSuccess, withApiErrors } from "../../../server/utils/api";

export function POST(request: Request) {
  return withApiErrors(async () => {
    await requireUser();
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new AppError("Request must be multipart form data", 400, "INVALID_FORM_DATA");
    }
    const file = uploadFileSchema.parse(formData.get("file"));
    const stored = await uploadImage({
      buffer: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
    });
    return jsonSuccess(stored, 201);
  });
}
