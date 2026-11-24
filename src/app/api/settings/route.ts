import { updateSystemConfigSchema } from "../../../shared/validators/settings.schema";
import { requireAdmin } from "../../../server/permissions/guards";
import {
  getSystemConfig,
  updateSystemConfig,
} from "../../../server/services/settings.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../server/utils/api";

export function GET() {
  return withApiErrors(async () => {
    await requireAdmin();
    return jsonSuccess(await getSystemConfig());
  });
}

export function PATCH(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireAdmin();
    const input = await parseJsonBody(request, updateSystemConfigSchema);
    return jsonSuccess(await updateSystemConfig(actor, input));
  });
}
