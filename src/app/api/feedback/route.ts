import { createFeedbackSchema } from "../../../shared/validators/feedback.schema";
import { requireUser } from "../../../server/permissions/guards";
import { createFeedback } from "../../../server/services/feedback.service";
import {
  jsonSuccess,
  parseJsonBody,
  withApiErrors,
} from "../../../server/utils/api";

export function POST(request: Request) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const input = await parseJsonBody(request, createFeedbackSchema);
    return jsonSuccess(await createFeedback(actor, input), 201);
  });
}
