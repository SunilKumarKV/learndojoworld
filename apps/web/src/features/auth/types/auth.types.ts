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
