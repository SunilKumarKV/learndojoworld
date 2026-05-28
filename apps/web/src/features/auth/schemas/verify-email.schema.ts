import { z } from "zod";

export const verifyEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  code: z.string().trim().min(6, "Verification code is required."),
});

export type VerifyEmailSchema = z.infer<typeof verifyEmailSchema>;
