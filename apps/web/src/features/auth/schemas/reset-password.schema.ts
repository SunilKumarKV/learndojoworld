import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    code: z.string().trim().min(6, "Verification code is required."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
