import { NextResponse } from "next/server";
import { citizenRegistrationSchema } from "../../../../shared/validators/auth.schema";
import {
  EmailAlreadyRegisteredError,
  registerCitizen,
} from "../../../../server/services/auth.service";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_JSON", message: "Request body must be valid JSON" },
      },
      { status: 400 },
    );
  }

  const parsed = citizenRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Registration details are invalid",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  try {
    const user = await registerCitizen(parsed.data);
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "EMAIL_ALREADY_REGISTERED", message: error.message },
        },
        { status: 409 },
      );
    }

    throw error;
  }
}
