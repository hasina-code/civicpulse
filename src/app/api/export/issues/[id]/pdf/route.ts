import { requireUser } from "../../../../../../server/permissions/guards";
import { exportIssuePdf } from "../../../../../../server/services/export.service";
import { withApiErrors } from "../../../../../../server/utils/api";

type RouteContext = { params: Promise<{ id: string }> };

export function GET(_request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const actor = await requireUser();
    const { id } = await params;
    const pdf = await exportIssuePdf(actor, id);
    const filename = id.replace(/[^A-Za-z0-9_-]/g, "");
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="issue-${filename}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  });
}
