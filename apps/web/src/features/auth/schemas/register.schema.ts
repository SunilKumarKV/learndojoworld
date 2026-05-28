import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required."),
    username: z.string().trim().min(3, "Username is required."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type RegisterSchema = z.infer<typeof registerSchema>;
