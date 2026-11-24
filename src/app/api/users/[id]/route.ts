import { updateUserSchema } from "../../../../shared/validators/user.schema";
import { requireAdmin } from "../../../../server/permissions/guards";
import {
  getUserById,
  updateUser,
} from "../../../../server/services/user.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../../server/utils/api";

type RouteContext = { params: Promise<{ id: string }> };

export function GET(_request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireAdmin();
    const { id } = await params;
    return jsonSuccess(await getUserById(actor, id));
  });
}

export function PATCH(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireAdmin();
    const { id } = await params;
    const input = await parseJsonBody(request, updateUserSchema);
    return jsonSuccess(await updateUser(actor, id, input));
  });
}
