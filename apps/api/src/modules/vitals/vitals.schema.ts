import { z } from 'zod';

export const createBPSchema = z.object({
  systolic: z.number().int().min(40).max(260),
  diastolic: z.number().int().min(20).max(180),
  measuredAt: z.string().datetime().optional(),
});

export const createBSSchema = z.object({
  glucoseValue: z.number().min(1).max(40),
  mealContext: z.string().max(30).optional(),
  measuredAt: z.string().datetime().optional(),
});

export const listQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const elderIdParam = z.object({ elderId: z.string().uuid() });

export type CreateBPInput = z.infer<typeof createBPSchema>;
export type CreateBSInput = z.infer<typeof createBSSchema>;
export type ListVitalsInput = z.infer<typeof listQuery>;
