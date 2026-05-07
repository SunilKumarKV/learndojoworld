const { z } = require('zod');
const { PUBLIC_REGISTRATION_ROLES, ROLES } = require('./auth.constants');

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name must be 80 characters or less')
  .optional();

const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address')
  .max(255, 'Email must be 255 characters or less')
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be 128 characters or less');

const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z
    .enum(Object.values(ROLES))
    .optional()
    .default(ROLES.LEARNER)
    .refine((role) => PUBLIC_REGISTRATION_ROLES.includes(role), {
      message: 'Admin users cannot self-register',
    }),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const logoutSchema = refreshSchema;

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
};
