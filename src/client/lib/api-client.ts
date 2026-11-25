import type { ApiResponse } from "../../shared/types/api";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError(
      `The server returned an unreadable response (${response.status}).`,
      response.status,
    );
  }

  if (!isApiResponse<T>(payload)) {
    throw new ApiClientError(
      `The server returned an unexpected response (${response.status}).`,
      response.status,
    );
  }

  if (!response.ok || !payload.success) {
    const error = payload.success ? undefined : payload.error;
    throw new ApiClientError(
      error?.message ?? `Request failed with status ${response.status}.`,
      response.status,
      error?.code,
      error?.details,
    );
  }

  return payload.data;
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (typeof value !== "object" || value === null || !("success" in value)) {
    return false;
  }

  if (value.success === true) {
    return "data" in value;
  }

  if (value.success === false && "error" in value) {
    return (
      typeof value.error === "object" &&
      value.error !== null &&
      "message" in value.error &&
      typeof value.error.message === "string"
    );
  }

  return false;
}

function withJsonBody(body: unknown, init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    body: JSON.stringify(body),
  };
}

export const apiClient = {
  get: <T>(input: RequestInfo | URL, init?: RequestInit) =>
    request<T>(input, init),
  post: <T>(input: RequestInfo | URL, body: unknown, init?: RequestInit) =>
    request<T>(input, withJsonBody(body, { ...init, method: "POST" })),
  patch: <T>(input: RequestInfo | URL, body: unknown, init?: RequestInit) =>
    request<T>(input, withJsonBody(body, { ...init, method: "PATCH" })),
  put: <T>(input: RequestInfo | URL, body: unknown, init?: RequestInit) =>
    request<T>(input, withJsonBody(body, { ...init, method: "PUT" })),
  delete: <T>(input: RequestInfo | URL, init?: RequestInit) =>
    request<T>(input, { ...init, method: "DELETE" }),
};
