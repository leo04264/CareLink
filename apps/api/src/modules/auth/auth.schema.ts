import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().length(64),
});

export const logoutSchema = z.object({
  refreshToken: z.string().length(64),
});

export const elderPairSchema = z.object({
  elderId: z.string().uuid(),
});

export const elderVerifySchema = z.object({
  pairCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z2-9]{6}$/, 'Pair code must be 6 upper-case alphanumerics'),
  pushToken: z.string().optional(),
  platform: z.enum(['ios', 'android', 'web']).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ElderPairInput = z.infer<typeof elderPairSchema>;
export type ElderVerifyInput = z.infer<typeof elderVerifySchema>;
