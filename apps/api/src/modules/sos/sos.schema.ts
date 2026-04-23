import { z } from 'zod';

export const createSosSchema = z.object({
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export const historyQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const elderIdParam = z.object({ elderId: z.string().uuid() });
export const sosIdParam = z.object({ sosId: z.string().uuid() });

export type CreateSosInput = z.infer<typeof createSosSchema>;
export type HistoryQueryInput = z.infer<typeof historyQuery>;
