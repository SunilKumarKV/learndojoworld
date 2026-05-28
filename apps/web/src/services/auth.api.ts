const STORAGE_KEY = "ldw_auth_tokens";
const API_BASE = String(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(
  /\/+$/g,
  "",
);

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  username: string;
  role: string;
  isActive: boolean;
  isSuspended: boolean;
  lastLoginAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthResponse<T = unknown> = {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
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

function normalizeApiResponse<T>(body: unknown) {
  if (body && typeof body === "object" && "success" in body) {
    return body as AuthResponse<T>;
  }

  return {
    success: true,
    message: "",
    data: body as T,
  } satisfies AuthResponse<T>;
}

function getStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as AuthTokens | null;
  } catch {
    return null;
  }
}

function setStoredTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<AuthResponse<T>> {
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

  if (response.status === 401 && retry && tokens?.refreshToken) {
    try {
      await refresh(tokens.refreshToken);
      return request<T>(path, options, false);
    } catch (error) {
      clearStoredAuth();
      throw error;
    }
  }

  if (!response.ok) {
    const message =
      normalized.message ||
      (body && typeof body === "object" && "message" in body
        ? String((body as Record<string, unknown>).message)
        : response.statusText);
    const errorCode =
      normalized.errorCode ??
      (body && typeof body === "object" && "errorCode" in body
        ? String((body as Record<string, unknown>).errorCode)
        : undefined);
    throw new ApiError(message || "Request failed", response.status, errorCode);
  }

  return normalized;
}

export async function register(payload: {
  name: string;
  username: string;
  email: string;
  password: string;
}) {
  return request<{ user: AuthUser; tokens: AuthTokens }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: { identifier: string; password: string }) {
  return request<{ user: AuthUser; tokens: AuthTokens }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function refresh(refreshToken: string) {
  const response = await request<{ tokens: AuthTokens }>(
    "/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    },
    false,
  );

  if (!response.success) {
    throw new ApiError(response.message || "Unable to refresh session", 401, response.errorCode);
  }

  setStoredTokens(response.data.tokens);
  return response.data.tokens;
}

export async function logout() {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) {
    clearStoredAuth();
    return { success: true, message: "Logged out", data: null } as AuthResponse<null>;
  }

  try {
    return await request<null>("/auth/logout", {
      method: "POST",
    });
  } finally {
    clearStoredAuth();
  }
}

export async function me() {
  const response = await request<AuthUser>("/users/me");
  if (!response.success) {
    throw new ApiError(response.message || "Unable to load session", 500, response.errorCode);
  }
  return response.data;
}

export function persistAuthTokens(tokens: AuthTokens) {
  setStoredTokens(tokens);
}
