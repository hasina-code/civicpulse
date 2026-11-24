import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AuthorizationError } from "../permissions/guards";
import { AppError } from "./errors";
import { IssueWorkflowError } from "../workflow/transitions";

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function parseJsonBody<Schema extends ZodType>(
  request: Request,
  schema: Schema,
): Promise<Schema["_output"]> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON", 400, "INVALID_JSON");
  }
  return schema.parse(body);
}

export async function withApiErrors(
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: error.issues,
          },
        },
        { status: 400 },
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: error.statusCode },
      );
    }

    if (error instanceof IssueWorkflowError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: error.status },
      );
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "AUTHORIZATION_ERROR", message: error.message },
        },
        { status: error.status },
      );
    }

    throw error;
  }
}
