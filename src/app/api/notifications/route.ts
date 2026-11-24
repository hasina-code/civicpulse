import { z } from "zod";
import { paginationSchema } from "../../../shared/validators/common.schema";
import { requireUser } from "../../../server/permissions/guards";
import { listNotifications } from "../../../server/services/notification.service";
import { jsonSuccess, withApiErrors } from "../../../server/utils/api";

const notificationQuerySchema = paginationSchema.extend({
  since: z.string().datetime({ offset: true }).optional(),
});

export function GET(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const query = notificationQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return jsonSuccess(
      await listNotifications(actor.id, {
        page: query.page,
        limit: query.limit,
        since: query.since ? new Date(query.since) : undefined,
      }),
    );
  });
}
