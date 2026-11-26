import { createDepartmentSchema } from "../../../shared/validators/department.schema";
import { requireAdmin } from "../../../server/permissions/guards";
import { getCurrentSession } from "../../../server/auth/session";
import {
  createDepartment,
  listDepartments,
  listPublicDepartments,
} from "../../../server/services/department.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../server/utils/api";

export function GET() {
  return withApiErrors(async () => {
    const session = await getCurrentSession();
    if (!session?.user.id) {
      return jsonSuccess(await listPublicDepartments());
    }

    return jsonSuccess(
      await listDepartments({
        id: session.user.id,
        role: session.user.role,
        departmentId: session.user.departmentId,
      }),
    );
  });
}

export function POST(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireAdmin();
    const input = await parseJsonBody(request, createDepartmentSchema);
    return jsonSuccess(await createDepartment(actor, input), 201);
  });
}
