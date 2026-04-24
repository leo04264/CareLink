import type { ElderStatusResponse, ElderSummary } from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import { ApiException } from '../../plugins/error-handler';
import { prisma } from '../../lib/prisma';
import { assertElderAccess, assertMember } from '../../lib/membership';
import { computeStreak, hasCheckedInToday } from '../checkin/checkin.service';
import { getMedicationStatusForElder } from '../medication/medication.service';
import { getVitalsStatusForElder } from '../vitals/vitals.service';
import { getNextAppointmentForElder } from '../appointment/appointment.service';
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

// Dashboard status. Fields populated as modules ship: PR F fills checkinToday,
// later PRs fill medications / nextAppointment / lastBP / lastGlucose.
export async function getElderStatus(callerId: string, elderId: string): Promise<ElderStatusResponse> {
  await assertElderAccess(callerId, elderId);

  const [today, streak, medStatus, vitalsStatus, nextAppt] = await Promise.all([
    hasCheckedInToday(elderId),
    computeStreak(elderId),
    getMedicationStatusForElder(elderId),
    getVitalsStatusForElder(elderId),
    getNextAppointmentForElder(elderId),
  ]);

  return {
    checkinToday: {
      checked: today.checked,
      checkedAt: today.checkedAt ? today.checkedAt.toISOString() : null,
      streakDays: streak.streakDays,
    },
    medications: medStatus,
    nextAppointment: nextAppt,
    lastBP: vitalsStatus.lastBP,
    lastGlucose: vitalsStatus.lastGlucose,
  };
}
