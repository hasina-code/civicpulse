import { requireUser } from "../../../../../server/permissions/guards";
import { uploadImage } from "../../../../../server/storage";
import { uploadFileSchema } from "../../../../../server/storage/upload-file.schema";
import { updateMe } from "../../../../../server/services/user.service";
import { AppError } from "../../../../../server/utils/errors";
import {
  jsonSuccess,
  withApiErrors,
} from "../../../../../server/utils/api";

export function POST(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new AppError(
        "Request must be multipart form data",
        400,
        "INVALID_FORM_DATA",
      );
    }

    const file = uploadFileSchema.parse(formData.get("file"));
    const stored = await uploadImage(
      {
        buffer: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type,
      },
      "civicpulse/profiles",
    );
    const profile = await updateMe(actor.id, { imageUrl: stored.url });
    return jsonSuccess(profile, 201);
  });
}
