const STORAGE_KEY = "ldw_onboarding_profile";
const API_BASE = String(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(
  /\/+$/g,
  "",
);

export type LearnerOnboardingPayload = {
  goals: string[];
  topics: string[];
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  dailyGoalMin: number;
  learningStyle: string[];
};

export type ApiResponse<T = unknown> = {
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

function normalizeApiResponse<T>(body: unknown): ApiResponse<T> {
  if (body && typeof body === "object" && "success" in body) {
    return body as ApiResponse<T>;
  }

  return {
    success: true,
    message: "",
    data: body as T,
  } satisfies ApiResponse<T>;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
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
        ? String((body as Record<string, unknown>).message)
        : response.statusText);
    throw new ApiError(message || "Request failed", response.status, normalized.errorCode);
  }

  return normalized;
}

export async function submitLearnerOnboarding(payload: LearnerOnboardingPayload) {
  return request<unknown>("/onboarding/learner", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLearnerOnboarding() {
  return request<{
    completed: boolean;
    goals: string[];
    topics: string[];
    level: string | null;
    dailyGoalMin: number;
    learningStyle: string[];
  }>("/onboarding/learner");
}

export function storeOnboardingProfile(profile: LearnerOnboardingPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function getStoredOnboardingProfile(): LearnerOnboardingPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as LearnerOnboardingPayload | null;
  } catch {
    return null;
  }
}

export function clearOnboardingProfile() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
