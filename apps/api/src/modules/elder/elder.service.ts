import type { ElderStatusResponse, ElderSummary } from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import { ApiException } from '../../plugins/error-handler';
import { prisma } from '../../lib/prisma';
import { assertElderAccess, assertMember } from '../../lib/membership';
import type { CreateElderInput, UpdateElderInput, UpdatePushTokenInput } from './elder.schema';

function toSummary(e: {
  id: string;
  name: string;
  birthDate: Date | null;
  avatarUrl: string | null;
}): ElderSummary {
  return {
    id: e.id,
    name: e.name,
    birthDate: e.birthDate ? e.birthDate.toISOString() : null,
    avatarUrl: e.avatarUrl ?? null,
  };
}

export async function createElder(callerId: string, familyId: string, input: CreateElderInput) {
  await assertMember(callerId, familyId);
  const elder = await prisma.elder.create({
    data: {
      name: input.name,
      familyId,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
    },
  });
  return toSummary(elder);
}

export async function getElder(callerId: string, elderId: string) {
  await assertElderAccess(callerId, elderId);
  const elder = await prisma.elder.findUnique({ where: { id: elderId } });
  if (!elder) throw new ApiException(ErrorCodes.NOT_FOUND, 'Elder not found');
  return toSummary(elder);
}

export async function updateElder(callerId: string, elderId: string, input: UpdateElderInput) {
  await assertElderAccess(callerId, elderId);
  const elder = await prisma.elder.update({
    where: { id: elderId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.birthDate !== undefined && { birthDate: input.birthDate ? new Date(input.birthDate) : null }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
    },
  });
  return toSummary(elder);
}

// Elder-token-authenticated. Caller must be THIS elder (callerElderId === elderId
// from path), not just any elder.
export async function updatePushToken(
  callerElderId: string,
  elderId: string,
  input: UpdatePushTokenInput,
) {
  if (callerElderId !== elderId) {
    throw new ApiException(ErrorCodes.AUTH_UNAUTHORIZED, 'Elder token does not match requested elderId');
  }
  const elder = await prisma.elder.findUnique({ where: { id: elderId } });
  if (!elder) throw new ApiException(ErrorCodes.NOT_FOUND, 'Elder not found');
  await prisma.elder.update({
    where: { id: elderId },
    data: { deviceToken: input.pushToken, platform: input.platform },
  });
}

// Dashboard status. Until checkin / medication / vitals / appointment modules
// land, all downstream fields are null / zero. The shape is stable so the
// mobile app can bind today and fill in with real data as each PR lands.
export async function getElderStatus(callerId: string, elderId: string): Promise<ElderStatusResponse> {
  await assertElderAccess(callerId, elderId);
  return {
    checkinToday: { checked: false, checkedAt: null, streakDays: 0 },
    medications: { total: 0, completedToday: 0, nextReminder: null },
    nextAppointment: null,
    lastBP: null,
    lastGlucose: null,
  };
}
