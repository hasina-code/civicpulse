import {
  updatePasswordSchema,
  updateProfileSchema,
} from "../../../../shared/validators/user.schema";
import { requireUser } from "../../../../server/permissions/guards";
import {
  getMe,
  updateMe,
  updateMyPassword,
} from "../../../../server/services/user.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../../server/utils/api";

export function GET() {
  return withApiErrors(async () => {
    const actor = await requireUser();
    return jsonSuccess(await getMe(actor.id));
  });
}

export function PATCH(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const input = await parseJsonBody(request, updateProfileSchema);
    return jsonSuccess(await updateMe(actor.id, input));
  });
}

export function PUT(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const input = await parseJsonBody(request, updatePasswordSchema);
    return jsonSuccess(await updateMyPassword(actor.id, input));
  });
}
