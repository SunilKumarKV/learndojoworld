const API_BASE = String(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(
  /\/+$/g,
  "",
);

export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | undefined;
};

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string | string[];
  };
  errorCode?: string;
  message?: string | string[];
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly errorCode: string | undefined;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

function getStoredTokens() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem("ldw_auth_tokens") ?? "null") as {
      accessToken?: string;
      refreshToken?: string;
    } | null;
  } catch {
    return null;
  }
}

export function hasStoredAccessToken() {
  return Boolean(getStoredTokens()?.accessToken);
}

function normalizeApiResponse<T>(body: unknown): ApiResponse<T> {
  if (body && typeof body === "object" && "success" in body) {
    const typedBody = body as ApiResponse<T> & ApiErrorBody;
    const errorMessage = Array.isArray(typedBody.error?.message)
      ? typedBody.error.message.join(", ")
      : typedBody.error?.message;
    const message = Array.isArray(typedBody.message)
      ? typedBody.message.join(", ")
      : (typedBody.message ?? errorMessage ?? "");

    return {
      ...typedBody,
      message,
      errorCode: typedBody.errorCode ?? typedBody.error?.code,
    };
  }

  return {
    success: true,
    message: "",
    data: body as T,
    errorCode: undefined,
  } satisfies ApiResponse<T>;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiClient<T>(path: string, options: RequestInit = {}) {
  const tokens = getStoredTokens();
  const headers = new Headers({
    "Content-Type": "application/json",
    ...(options.headers instanceof Headers
      ? Object.fromEntries(options.headers.entries())
      : (options.headers ?? {})),
  });

  if (tokens?.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "omit",
    ...options,
    headers,
  });

  const body = await parseJson(response);
  const normalized = normalizeApiResponse<T>(body ?? {});

  if (!response.ok) {
    const message =
      normalized.message ||
      (body && typeof body === "object" && "message" in body
        ? String((body as ApiErrorBody).message)
        : response.statusText);

    throw new ApiError(message || "Request failed", response.status, normalized.errorCode);
  }

  return normalized;
}
