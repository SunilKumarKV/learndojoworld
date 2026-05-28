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

export type AuthLoginForm = {
  identifier: string;
  password: string;
};

export type AuthRegisterForm = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type ForgotPasswordForm = {
  email: string;
};

export type ResetPasswordForm = {
  code: string;
  password: string;
  confirmPassword: string;
};

export type VerifyEmailForm = {
  email: string;
  code: string;
};

export type RegisterPayload = {
  fullName?: string;
  name?: string;
  username: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  identifier?: string;
  email?: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token?: string;
  code?: string;
  newPassword?: string;
  password?: string;
};

export type VerifyEmailPayload = {
  token?: string;
  email?: string;
  code?: string;
};

export type AuthStateStatus = "idle" | "loading" | "authenticated" | "unauthenticated";
