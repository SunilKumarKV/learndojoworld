import { z } from 'zod';

export const loginSchema = z.object({ email: z.email(), password: z.string().min(8) });
export const registerSchema = z.object({
 fullName: z.string().min(2),
 username: z.string().min(3),
 email: z.email(),
 password: z.string().min(8),
 confirmPassword: z.string().min(8),
}).refine((d)=>d.password===d.confirmPassword,{path:['confirmPassword'],message:'Passwords must match'});
export const forgotPasswordSchema = z.object({ email: z.email() });
export const resetPasswordSchema = z.object({ token: z.string().min(1), newPassword: z.string().min(8), confirmPassword: z.string().min(8) }).refine((d)=>d.newPassword===d.confirmPassword,{path:['confirmPassword'],message:'Passwords must match'});
