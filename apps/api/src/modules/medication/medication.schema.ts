import { z } from 'zod';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be HH:MM');

export const scheduleInput = z.object({
  time: hhmm,
  mealContext: z.string().max(30).nullable().optional(),
  amountNote: z.string().max(60).nullable().optional(),
  isEnabled: z.boolean().optional(),
});

export const createMedSchema = z.object({
  name: z.string().trim().min(1).max(60),
  dosage: z.string().max(30).nullable().optional(),
  amountPerDose: z.string().max(30).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  note: z.string().max(200).nullable().optional(),
  frequency: z.enum(['DAILY', 'EVERY_OTHER', 'WEEKLY', 'AS_NEEDED']).optional(),
  schedules: z.array(scheduleInput).max(8).optional(),
});

export const updateMedSchema = createMedSchema.omit({ schedules: true }).partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: 'At least one field required' },
);

export const pauseSchema = z.object({
  pause: z.boolean(),
  reason: z.string().max(200).nullable().optional(),
});

export const updateScheduleSchema = scheduleInput.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: 'At least one field required' },
);

export const createLogSchema = z.object({
  scheduleTime: hhmm.optional(),
  photoUrl: z.string().url().optional(),
});

export const logsQuery = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const elderIdParam = z.object({ elderId: z.string().uuid() });
export const medIdParam = z.object({ medId: z.string().uuid() });
export const medSchedParam = z.object({
  medId: z.string().uuid(),
  schedId: z.string().uuid(),
});

export type CreateMedInput = z.infer<typeof createMedSchema>;
export type UpdateMedInput = z.infer<typeof updateMedSchema>;
export type PauseInput = z.infer<typeof pauseSchema>;
export type ScheduleInputType = z.infer<typeof scheduleInput>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type CreateLogInput = z.infer<typeof createLogSchema>;
export type LogsQueryInput = z.infer<typeof logsQuery>;
