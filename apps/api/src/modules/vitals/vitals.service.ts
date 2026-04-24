import type { BPRecord, BSRecord, VitalStatus, VitalsSummary } from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import { ApiException } from '../../plugins/error-handler';
import { prisma } from '../../lib/prisma';
import { assertElderAccess, assertMember } from '../../lib/membership';
import { notifyFamily } from '../../lib/notify';
import type { CreateBPInput, CreateBSInput, ListVitalsInput } from './vitals.schema';

// Dual-auth helper: when the caller is an elder their token carries elderId;
// when the caller is a caregiver we look up family membership.
async function assertWriteAccess(
  caller: { type: 'user'; sub: string } | { type: 'elder'; elderId: string },
  elderId: string,
) {
  if (caller.type === 'elder') {
    if (caller.elderId !== elderId) {
      throw new ApiException(ErrorCodes.AUTH_UNAUTHORIZED, 'Elder token does not match requested elderId');
    }
    return;
  }
  // Caregiver path
  const elder = await prisma.elder.findUnique({
    where: { id: elderId },
    select: { familyId: true },
  });
  if (!elder) throw new ApiException(ErrorCodes.NOT_FOUND, 'Elder not found');
  await assertMember(caller.sub, elder.familyId);
}

// Thresholds follow spec commentary §5.6 (≥140 triggers alert). ELEVATED kept
// for the in-between band so the dashboard can colour-code.
function bpStatus(sys: number, dia: number): VitalStatus {
  if (sys >= 140 || dia >= 90) return 'HIGH';
  if (sys >= 130 || dia >= 80) return 'ELEVATED';
  return 'NORMAL';
}
function bsStatus(val: number, ctx: string | null): VitalStatus {
  const normalMax = ctx === '餐後' || ctx === '餐後2hr' ? 7.8 : 6.1;
  if (val > normalMax + 2) return 'HIGH';
  if (val > normalMax) return 'ELEVATED';
  return 'NORMAL';
}

// ── create BP ─────────────────────────────────────────────────────────────
export async function createBP(
  caller: { type: 'user'; sub: string } | { type: 'elder'; elderId: string },
  elderId: string,
  input: CreateBPInput,
) {
  await assertWriteAccess(caller, elderId);
  const row = await prisma.healthVital.create({
    data: {
      elderId,
      type: 'BLOOD_PRESSURE',
      systolic: input.systolic,
      diastolic: input.diastolic,
      measuredAt: input.measuredAt ? new Date(input.measuredAt) : new Date(),
    },
  });

  // TODO(PR K): actual push. For now we only write the notification row when
  // the reading is HIGH, matching spec §5.6 "收縮壓 ≥ 140 自動推播".
  if (bpStatus(input.systolic, input.diastolic) === 'HIGH') {
    const elder = await prisma.elder.findUnique({ where: { id: elderId }, select: { name: true } });
    await notifyFamily({
      elderId,
      type: 'MEDICATION', // reuse enum; PR K may add BP_ELEVATED if needed
      title: `${elder?.name ?? '長輩'} 血壓偏高`,
      body: `收縮壓 ${input.systolic} / 舒張壓 ${input.diastolic} mmHg`,
      data: { vitalId: row.id, systolic: input.systolic, diastolic: input.diastolic },
    });
  }

  const rec: BPRecord = {
    id: row.id,
    systolic: row.systolic!,
    diastolic: row.diastolic!,
    measuredAt: row.measuredAt.toISOString(),
  };
  return rec;
}

// ── create BS ─────────────────────────────────────────────────────────────
export async function createBS(
  caller: { type: 'user'; sub: string } | { type: 'elder'; elderId: string },
  elderId: string,
  input: CreateBSInput,
) {
  await assertWriteAccess(caller, elderId);
  const row = await prisma.healthVital.create({
    data: {
      elderId,
      type: 'BLOOD_SUGAR',
      glucoseValue: input.glucoseValue,
      mealContext: input.mealContext ?? null,
      measuredAt: input.measuredAt ? new Date(input.measuredAt) : new Date(),
    },
  });
  const rec: BSRecord = {
    id: row.id,
    glucoseValue: row.glucoseValue!,
    mealContext: row.mealContext,
    measuredAt: row.measuredAt.toISOString(),
  };
  return rec;
}

// ── list helpers ──────────────────────────────────────────────────────────
async function listVitals(callerId: string, elderId: string, type: 'BLOOD_PRESSURE' | 'BLOOD_SUGAR', q: ListVitalsInput) {
  await assertElderAccess(callerId, elderId);
  return prisma.healthVital.findMany({
    where: {
      elderId,
      type,
      ...((q.from || q.to) && {
        measuredAt: {
          ...(q.from && { gte: new Date(q.from) }),
          ...(q.to && { lte: new Date(q.to) }),
        },
      }),
    },
    orderBy: { measuredAt: 'desc' },
    take: q.limit,
  });
}

export async function listBP(callerId: string, elderId: string, q: ListVitalsInput): Promise<BPRecord[]> {
  const rows = await listVitals(callerId, elderId, 'BLOOD_PRESSURE', q);
  return rows.map((r) => ({
    id: r.id,
    systolic: r.systolic!,
    diastolic: r.diastolic!,
    measuredAt: r.measuredAt.toISOString(),
  }));
}

export async function listBS(callerId: string, elderId: string, q: ListVitalsInput): Promise<BSRecord[]> {
  const rows = await listVitals(callerId, elderId, 'BLOOD_SUGAR', q);
  return rows.map((r) => ({
    id: r.id,
    glucoseValue: r.glucoseValue!,
    mealContext: r.mealContext,
    measuredAt: r.measuredAt.toISOString(),
  }));
}

// ── summary ───────────────────────────────────────────────────────────────
function weekStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 7);
  return d;
}

export async function getSummary(callerId: string, elderId: string): Promise<VitalsSummary> {
  await assertElderAccess(callerId, elderId);
  const since = weekStart();

  const [bpLatest, bpAvg, bsLatest, bsAvg] = await Promise.all([
    prisma.healthVital.findFirst({
      where: { elderId, type: 'BLOOD_PRESSURE' },
      orderBy: { measuredAt: 'desc' },
    }),
    prisma.healthVital.aggregate({
      where: { elderId, type: 'BLOOD_PRESSURE', measuredAt: { gte: since } },
      _avg: { systolic: true, diastolic: true },
    }),
    prisma.healthVital.findFirst({
      where: { elderId, type: 'BLOOD_SUGAR' },
      orderBy: { measuredAt: 'desc' },
    }),
    prisma.healthVital.aggregate({
      where: { elderId, type: 'BLOOD_SUGAR', measuredAt: { gte: since } },
      _avg: { glucoseValue: true },
    }),
  ]);

  return {
    bloodPressure: {
      latest: bpLatest
        ? {
            systolic: bpLatest.systolic!,
            diastolic: bpLatest.diastolic!,
            measuredAt: bpLatest.measuredAt.toISOString(),
          }
        : null,
      weeklyAvg:
        bpAvg._avg.systolic !== null && bpAvg._avg.diastolic !== null
          ? { systolic: Math.round(bpAvg._avg.systolic), diastolic: Math.round(bpAvg._avg.diastolic) }
          : null,
      status: bpLatest ? bpStatus(bpLatest.systolic!, bpLatest.diastolic!) : 'NORMAL',
    },
    bloodSugar: {
      latest: bsLatest
        ? {
            value: bsLatest.glucoseValue!,
            context: bsLatest.mealContext,
            measuredAt: bsLatest.measuredAt.toISOString(),
          }
        : null,
      weeklyAvg: bsAvg._avg.glucoseValue !== null ? Math.round(bsAvg._avg.glucoseValue * 10) / 10 : null,
      status: bsLatest ? bsStatus(bsLatest.glucoseValue!, bsLatest.mealContext) : 'NORMAL',
    },
  };
}

// ── status helper (consumed by /elders/:id/status) ────────────────────────
export async function getVitalsStatusForElder(elderId: string) {
  const [bp, bs] = await Promise.all([
    prisma.healthVital.findFirst({
      where: { elderId, type: 'BLOOD_PRESSURE' },
      orderBy: { measuredAt: 'desc' },
    }),
    prisma.healthVital.findFirst({
      where: { elderId, type: 'BLOOD_SUGAR' },
      orderBy: { measuredAt: 'desc' },
    }),
  ]);
  return {
    lastBP: bp
      ? { systolic: bp.systolic!, diastolic: bp.diastolic!, measuredAt: bp.measuredAt.toISOString() }
      : null,
    lastGlucose: bs
      ? {
          value: bs.glucoseValue!,
          context: (bs.mealContext as 'pre' | 'post' | 'bed') ?? 'post',
          measuredAt: bs.measuredAt.toISOString(),
        }
      : null,
  };
}
