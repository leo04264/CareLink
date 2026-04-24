import { z } from 'zod';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be HH:MM');

export const listQuery = z.object({
  unread: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .transform((v) => v === true || v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateSettingsSchema = z
  .object({
    checkin: z.boolean().optional(),
    medication: z.boolean().optional(),
    medicationMissed: z.boolean().optional(),
    sos: z.boolean().optional(),
    appointment: z.boolean().optional(),
    checkinOverdue: z.boolean().optional(),
    vitalsAlert: z.boolean().optional(),
    quietStart: hhmm.nullable().optional(),
    quietEnd: hhmm.nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export const pushTokenSchema = z.object({
  token: z.string().min(1).max(200),
  platform: z.enum(['ios', 'android', 'web']),
});

export const userIdParam = z.object({ userId: z.string().uuid() });
export const notifIdParam = z.object({ notifId: z.string().uuid() });

export type ListQueryInput = z.infer<typeof listQuery>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type PushTokenInput = z.infer<typeof pushTokenSchema>;
