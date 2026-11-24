import { requireUser } from "../../../../../server/permissions/guards";
import { markNotificationRead } from "../../../../../server/services/notification.service";
import { jsonSuccess, withApiErrors } from "../../../../../server/utils/api";

type RouteContext = { params: Promise<{ id: string }> };

export function PATCH(_request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const { id } = await params;
    return jsonSuccess(await markNotificationRead(actor.id, id));
  });
}
