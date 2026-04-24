import type { MedicationDetail, MedicationStatus, ScheduleRecord, LogRecord } from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import { ApiException } from '../../plugins/error-handler';
import { prisma } from '../../lib/prisma';
import { assertElderAccess, assertMember } from '../../lib/membership';
import { notifyFamily } from '../../lib/notify';
import type {
  CreateLogInput,
  CreateMedInput,
  LogsQueryInput,
  PauseInput,
  ScheduleInputType,
  UpdateMedInput,
  UpdateScheduleInput,
} from './medication.schema';

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

async function getMedOr404(medId: string) {
  const m = await prisma.medication.findUnique({ where: { id: medId } });
  if (!m || m.status === 'DELETED') {
    throw new ApiException(ErrorCodes.NOT_FOUND, 'Medication not found');
  }
  return m;
}

function toScheduleRecord(s: {
  id: string;
  time: string;
  mealContext: string | null;
  amountNote: string | null;
  isEnabled: boolean;
}): ScheduleRecord {
  return {
    id: s.id,
    time: s.time,
    mealContext: s.mealContext,
    amountNote: s.amountNote,
    isEnabled: s.isEnabled,
  };
}

function toLogRecord(l: {
  id: string;
  takenAt: Date;
  scheduleTime: string | null;
  photoUrl: string | null;
  confirmed: boolean;
}): LogRecord {
  return {
    id: l.id,
    takenAt: l.takenAt.toISOString(),
    scheduleTime: l.scheduleTime,
    photoUrl: l.photoUrl,
    confirmed: l.confirmed,
  };
}

function toDetail(m: {
  id: string;
  name: string;
  dosage: string | null;
  amountPerDose: string | null;
  color: string | null;
  note: string | null;
  frequency: string;
  status: string;
  pauseReason: string | null;
  schedules: Parameters<typeof toScheduleRecord>[0][];
  logs: Parameters<typeof toLogRecord>[0][];
}): MedicationDetail {
  return {
    id: m.id,
    name: m.name,
    dosage: m.dosage,
    amountPerDose: m.amountPerDose,
    color: m.color,
    note: m.note,
    frequency: m.frequency as MedicationDetail['frequency'],
    status: m.status as MedicationStatus,
    pauseReason: m.pauseReason,
    schedules: m.schedules.map(toScheduleRecord),
    todayLogs: m.logs.map(toLogRecord),
  };
}

// ── list (user JWT) ───────────────────────────────────────────────────────
export async function listMedications(callerId: string, elderId: string) {
  await assertElderAccess(callerId, elderId);
  const dayStart = startOfDay();
  const dayEnd = addDays(dayStart, 1);

  const meds = await prisma.medication.findMany({
    where: { elderId, status: { not: 'DELETED' } },
    orderBy: { createdAt: 'asc' },
    include: {
      schedules: { orderBy: { time: 'asc' } },
      logs: {
        where: { takenAt: { gte: dayStart, lt: dayEnd } },
        orderBy: { takenAt: 'desc' },
      },
    },
  });
  return meds.map(toDetail);
}

// ── create ────────────────────────────────────────────────────────────────
export async function createMedication(callerId: string, elderId: string, input: CreateMedInput) {
  await assertElderAccess(callerId, elderId);
  const med = await prisma.medication.create({
    data: {
      elderId,
      name: input.name,
      dosage: input.dosage ?? null,
      amountPerDose: input.amountPerDose ?? null,
      color: input.color ?? null,
      note: input.note ?? null,
      frequency: (input.frequency ?? 'DAILY') as 'DAILY',
      schedules: input.schedules
        ? {
            createMany: {
              data: input.schedules.map((s) => ({
                time: s.time,
                mealContext: s.mealContext ?? null,
                amountNote: s.amountNote ?? null,
                isEnabled: s.isEnabled ?? true,
              })),
            },
          }
        : undefined,
    },
    include: { schedules: { orderBy: { time: 'asc' } }, logs: true },
  });
  return toDetail(med);
}

// ── update ────────────────────────────────────────────────────────────────
async function assertElderFromMed(callerId: string, medId: string) {
  const m = await getMedOr404(medId);
  await assertMember(callerId, (await prisma.elder.findUniqueOrThrow({
    where: { id: m.elderId }, select: { familyId: true },
  })).familyId);
  return m;
}

export async function updateMedication(callerId: string, medId: string, input: UpdateMedInput) {
  const m = await assertElderFromMed(callerId, medId);
  const updated = await prisma.medication.update({
    where: { id: m.id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.dosage !== undefined && { dosage: input.dosage }),
      ...(input.amountPerDose !== undefined && { amountPerDose: input.amountPerDose }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.note !== undefined && { note: input.note }),
      ...(input.frequency !== undefined && { frequency: input.frequency }),
    },
    include: { schedules: { orderBy: { time: 'asc' } }, logs: { take: 0 } },
  });
  return toDetail(updated);
}

// ── soft delete ───────────────────────────────────────────────────────────
export async function softDeleteMedication(callerId: string, medId: string) {
  const m = await assertElderFromMed(callerId, medId);
  await prisma.medication.update({
    where: { id: m.id },
    data: { status: 'DELETED' },
  });
}

// ── pause / resume ────────────────────────────────────────────────────────
export async function pauseMedication(callerId: string, medId: string, input: PauseInput) {
  const m = await assertElderFromMed(callerId, medId);
  await prisma.medication.update({
    where: { id: m.id },
    data: {
      status: input.pause ? 'PAUSED' : 'ACTIVE',
      pauseReason: input.pause ? input.reason ?? null : null,
    },
  });
}

// ── schedules CRUD ────────────────────────────────────────────────────────
export async function addSchedule(callerId: string, medId: string, input: ScheduleInputType) {
  const m = await assertElderFromMed(callerId, medId);
  const s = await prisma.medicationSchedule.create({
    data: {
      medicationId: m.id,
      time: input.time,
      mealContext: input.mealContext ?? null,
      amountNote: input.amountNote ?? null,
      isEnabled: input.isEnabled ?? true,
    },
  });
  return toScheduleRecord(s);
}

export async function updateSchedule(
  callerId: string,
  medId: string,
  schedId: string,
  input: UpdateScheduleInput,
) {
  const m = await assertElderFromMed(callerId, medId);
  const existing = await prisma.medicationSchedule.findUnique({ where: { id: schedId } });
  if (!existing || existing.medicationId !== m.id) {
    throw new ApiException(ErrorCodes.NOT_FOUND, 'Schedule not found on this medication');
  }
  const updated = await prisma.medicationSchedule.update({
    where: { id: schedId },
    data: {
      ...(input.time !== undefined && { time: input.time }),
      ...(input.mealContext !== undefined && { mealContext: input.mealContext }),
      ...(input.amountNote !== undefined && { amountNote: input.amountNote }),
      ...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
    },
  });
  return toScheduleRecord(updated);
}

export async function deleteSchedule(callerId: string, medId: string, schedId: string) {
  const m = await assertElderFromMed(callerId, medId);
  const existing = await prisma.medicationSchedule.findUnique({ where: { id: schedId } });
  if (!existing || existing.medicationId !== m.id) {
    throw new ApiException(ErrorCodes.NOT_FOUND, 'Schedule not found on this medication');
  }
  await prisma.medicationSchedule.delete({ where: { id: schedId } });
}

// ── log dose (elder JWT) ──────────────────────────────────────────────────
export async function logDose(callerElderId: string, medId: string, input: CreateLogInput) {
  const m = await getMedOr404(medId);
  if (m.elderId !== callerElderId) {
    throw new ApiException(ErrorCodes.AUTH_UNAUTHORIZED, 'Elder token does not match medication owner');
  }
  if (m.status !== 'ACTIVE') {
    throw new ApiException(ErrorCodes.MEDICATION_PAUSED, 'Medication is paused or deleted');
  }
  const log = await prisma.medicationLog.create({
    data: {
      medicationId: m.id,
      scheduleTime: input.scheduleTime ?? null,
      photoUrl: input.photoUrl ?? null,
      confirmed: true,
    },
  });
  await notifyFamily({
    elderId: m.elderId,
    type: 'MEDICATION',
    title: `已服用 ${m.name}`,
    body: input.scheduleTime ? `時間：${input.scheduleTime}` : '剛剛確認',
    data: { medicationId: m.id, logId: log.id },
  });
  return toLogRecord(log);
}

// ── logs list ─────────────────────────────────────────────────────────────
export async function listLogs(callerId: string, elderId: string, q: LogsQueryInput) {
  await assertElderAccess(callerId, elderId);

  let range: { gte: Date; lt: Date } | undefined;
  if (q.date) {
    const d = new Date(`${q.date}T00:00:00.000Z`);
    range = { gte: d, lt: addDays(d, 1) };
  } else if (q.from || q.to) {
    range = {
      gte: q.from ? new Date(q.from) : new Date('1970-01-01'),
      lt: q.to ? new Date(q.to) : new Date('2099-12-31'),
    };
  }

  const logs = await prisma.medicationLog.findMany({
    where: {
      medication: { elderId },
      ...(range && { takenAt: range }),
    },
    orderBy: { takenAt: 'desc' },
    take: 200,
    include: { medication: { select: { name: true, id: true } } },
  });
  return {
    items: logs.map((l) => ({
      ...toLogRecord(l),
      medicationId: l.medication.id,
      medicationName: l.medication.name,
    })),
  };
}

// ── status helper (consumed by /elders/:id/status) ────────────────────────
export async function getMedicationStatusForElder(elderId: string) {
  const meds = await prisma.medication.findMany({
    where: { elderId, status: 'ACTIVE' },
    select: {
      id: true,
      schedules: { where: { isEnabled: true }, select: { time: true } },
      logs: {
        where: { takenAt: { gte: startOfDay(), lt: addDays(startOfDay(), 1) } },
        select: { id: true },
      },
    },
  });
  const total = meds.length;
  const completedToday = meds.filter((m) => m.logs.length > 0).length;
  // Next reminder: earliest enabled schedule time across all meds that's after now.
  const now = new Date();
  const hhmmNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const times = meds.flatMap((m) => m.schedules.map((s) => s.time)).sort();
  const nextReminder = times.find((t) => t > hhmmNow) ?? times[0] ?? null;
  return { total, completedToday, nextReminder };
}
