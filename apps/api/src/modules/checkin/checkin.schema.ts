import { z } from 'zod';

export const createCheckinSchema = z.object({
  note: z.string().trim().max(200).nullable().optional(),
});

export const listCheckinsQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const elderIdParam = z.object({ elderId: z.string().uuid() });

export type CreateCheckinInput = z.infer<typeof createCheckinSchema>;
export type ListCheckinsInput = z.infer<typeof listCheckinsQuery>;
