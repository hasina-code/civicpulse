import { updateDepartmentSchema } from "../../../../shared/validators/department.schema";
import { requireAdmin, requireUser } from "../../../../server/permissions/guards";
import {
  getDepartmentById,
  updateDepartment,
} from "../../../../server/services/department.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../../server/utils/api";

type RouteContext = { params: Promise<{ id: string }> };

export function GET(_request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const { id } = await params;
    return jsonSuccess(await getDepartmentById(actor, id));
  });
}

export function PATCH(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireAdmin();
    const { id } = await params;
    const input = await parseJsonBody(request, updateDepartmentSchema);
    return jsonSuccess(await updateDepartment(actor, id, input));
  });
}
