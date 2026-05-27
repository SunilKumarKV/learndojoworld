export type AuthUser = {
  id: string;
  fullName?: string | null;
  name?: string | null;
  username?: string | null;
  email: string;
  emailVerified?: boolean;
  role?: string;
};

export type ApiResponse<TData = unknown> = {
  success: boolean;
  message: string;
  data?: TData;
  errorCode?: string;
};

export type AuthTokenPayload = {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
};

export type RegisterPayload = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type VerifyEmailPayload = {
  token: string;
};

export type AuthStateStatus = "idle" | "loading" | "authenticated" | "unauthenticated";
