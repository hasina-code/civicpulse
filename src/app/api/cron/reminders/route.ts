import { sendDueReminders } from "../../../../server/services/reminder.service";
import { AppError } from "../../../../server/utils/errors";
import { jsonSuccess, withApiErrors } from "../../../../server/utils/api";

export function GET(request: Request) {
  return withApiErrors(async () => {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new AppError("Cron secret is not configured", 500, "CRON_CONFIGURATION_ERROR");
    }
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      throw new AppError("Invalid cron authorization", 401, "UNAUTHORIZED");
    }
    return jsonSuccess(await sendDueReminders());
  });
}
