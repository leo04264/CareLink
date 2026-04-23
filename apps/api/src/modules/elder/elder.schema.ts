import { z } from 'zod';

export const createElderSchema = z.object({
  name: z.string().trim().min(1).max(50),
  birthDate: z.string().datetime().optional(), // ISO-8601
});

export const updateElderSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    birthDate: z.string().datetime().nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export const updatePushTokenSchema = z.object({
  pushToken: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
});

export const familyIdParam = z.object({
  familyId: z.string().uuid(),
});

export const elderIdParam = z.object({
  elderId: z.string().uuid(),
});

export type CreateElderInput = z.infer<typeof createElderSchema>;
export type UpdateElderInput = z.infer<typeof updateElderSchema>;
export type UpdatePushTokenInput = z.infer<typeof updatePushTokenSchema>;
