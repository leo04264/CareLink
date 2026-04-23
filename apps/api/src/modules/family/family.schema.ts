import { z } from 'zod';

export const createFamilySchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export const joinFamilySchema = z.object({
  inviteToken: z.string().length(64),
});

export const updateRoleSchema = z.object({
  role: z.enum(['PRIMARY', 'CAREGIVER']),
});

export const familyIdParam = z.object({
  familyId: z.string().uuid(),
});

export const memberParams = z.object({
  familyId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type JoinFamilyInput = z.infer<typeof joinFamilySchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
