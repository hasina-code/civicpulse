import type { ApiResponse } from "../../shared/types/api";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toApiError(error: AppError): ApiResponse<never> {
  return {
    success: false,
    error: {
      message: error.message,
      code: error.code,
    },
  };
}
