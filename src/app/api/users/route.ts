import { z } from "zod";
import { USER_ROLES } from "../../../shared/constants/roles";
import { idSchema, paginationSchema } from "../../../shared/validators/common.schema";
import { createUserSchema } from "../../../shared/validators/user.schema";
import {
  requireAdmin,
  requireManagerOrAdmin,
} from "../../../server/permissions/guards";
import { createUser, listUsers } from "../../../server/services/user.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../server/utils/api";

const userQuerySchema = paginationSchema.extend({
  role: z.enum(USER_ROLES).optional(),
  departmentId: idSchema.optional(),
});

export function GET(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireManagerOrAdmin();
    const query = userQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return jsonSuccess(await listUsers(actor, query));
  });
}

export function POST(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireAdmin();
    const input = await parseJsonBody(request, createUserSchema);
    return jsonSuccess(await createUser(actor, input), 201);
  });
}
