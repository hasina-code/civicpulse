import { createDepartmentSchema } from "../../../shared/validators/department.schema";
import { requireAdmin, requireUser } from "../../../server/permissions/guards";
import {
  createDepartment,
  listDepartments,
} from "../../../server/services/department.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../server/utils/api";

export function GET() {
  return withApiErrors(async () => {
    const actor = await requireUser();
    return jsonSuccess(await listDepartments(actor));
  });
}

export function POST(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireAdmin();
    const input = await parseJsonBody(request, createDepartmentSchema);
    return jsonSuccess(await createDepartment(actor, input), 201);
  });
}
