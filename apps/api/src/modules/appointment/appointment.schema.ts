import { z } from 'zod';

export const createApptSchema = z.object({
  department: z.string().trim().min(1).max(60),
  hospital: z.string().trim().min(1).max(60),
  scheduledAt: z.string().datetime(),
  note: z.string().max(300).nullable().optional(),
  remindDays: z.array(z.number().int().min(0).max(30)).max(5).optional(),
});

export const updateApptSchema = createApptSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: 'At least one field required' },
);

export const completeSchema = z.object({ note: z.string().max(300).optional() });

export const listQuery = z.object({
  status: z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED']).optional(),
});

export const elderIdParam = z.object({ elderId: z.string().uuid() });
export const apptIdParam = z.object({ apptId: z.string().uuid() });

export type CreateApptInput = z.infer<typeof createApptSchema>;
export type UpdateApptInput = z.infer<typeof updateApptSchema>;
export type CompleteInput = z.infer<typeof completeSchema>;
export type ListApptQuery = z.infer<typeof listQuery>;
