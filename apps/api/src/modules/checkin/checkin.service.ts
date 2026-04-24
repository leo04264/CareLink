import type { CheckinRecord, CheckinListResponse } from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import { ApiException } from '../../plugins/error-handler';
import { prisma } from '../../lib/prisma';
import { assertElderAccess } from '../../lib/membership';
import { notifyFamily } from '../../lib/notify';
import type { CreateCheckinInput, ListCheckinsInput } from './checkin.schema';

// ── date helpers (YYYY-MM-DD in server local TZ) ──────────────────────────
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// Computes how many consecutive days (ending today) have at least one
// checkin. Used by POST response and by /streak. Takes an optional
// prior-count so the caller can pre-fetch checkins and avoid re-querying.
export async function computeStreak(elderId: string): Promise<{ streakDays: number; lastCheckinAt: Date | null }> {
  // Latest 400 days' worth — enough for any reasonable streak.
  const rows = await prisma.checkin.findMany({
    where: { elderId },
    orderBy: { checkedAt: 'desc' },
    select: { checkedAt: true },
    take: 400,
  });
  if (rows.length === 0) return { streakDays: 0, lastCheckinAt: null };

  const lastCheckinAt = rows[0]!.checkedAt;

  // Collect distinct YYYY-MM-DD keys the elder has checked in.
  const dayKeys = new Set<string>();
  for (const r of rows) {
    const d = startOfDay(r.checkedAt);
    dayKeys.add(d.toISOString().slice(0, 10));
  }

  let streak = 0;
  const today = startOfDay(new Date());
  for (let i = 0; ; i++) {
    const candidate = addDays(today, -i).toISOString().slice(0, 10);
    if (dayKeys.has(candidate)) streak++;
    else break;
  }
  return { streakDays: streak, lastCheckinAt };
}

export async function hasCheckedInToday(elderId: string): Promise<{ checked: boolean; checkedAt: Date | null }> {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const row = await prisma.checkin.findFirst({
    where: { elderId, checkedAt: { gte: today, lt: tomorrow } },
    orderBy: { checkedAt: 'desc' },
    select: { checkedAt: true },
  });
  return { checked: !!row, checkedAt: row?.checkedAt ?? null };
}

// ── create (elder JWT) ────────────────────────────────────────────────────
// Spec §5.4 explicitly allows multiple presses a day; we just insert rows.
// CHECKIN_ALREADY_DONE applies to the ONCE-PER-DAY enforcement convention:
// if caregiver dashboard says "today ✓" we don't need to let the press
// redundantly trigger push. We soft-skip the push but still store the row.
export async function createCheckin(callerElderId: string, elderId: string, input: CreateCheckinInput) {
  if (callerElderId !== elderId) {
    throw new ApiException(ErrorCodes.AUTH_UNAUTHORIZED, 'Elder token does not match requested elderId');
  }

  const alreadyToday = await hasCheckedInToday(elderId);

  const row = await prisma.checkin.create({
    data: { elderId, note: input.note ?? null },
  });

  const streak = await computeStreak(elderId);

  if (!alreadyToday.checked) {
    const elder = await prisma.elder.findUnique({ where: { id: elderId }, select: { name: true } });
    const name = elder?.name ?? '長輩';
    await notifyFamily({
      elderId,
      type: 'CHECKIN',
      title: `${name} 今天回報「我很好」`,
      body: `連續回報 ${streak.streakDays} 天 🎉`,
      data: { checkinId: row.id, streakDays: streak.streakDays },
    });
  }

  return {
    id: row.id,
    checkedAt: row.checkedAt.toISOString(),
    streakDays: streak.streakDays,
  };
}

// ── list (user JWT) ───────────────────────────────────────────────────────
export async function listCheckins(
  callerId: string,
  elderId: string,
  q: ListCheckinsInput,
): Promise<CheckinListResponse> {
  await assertElderAccess(callerId, elderId);

  const where: Parameters<typeof prisma.checkin.findMany>[0] = {
    where: {
      elderId,
      ...((q.from || q.to) && {
        checkedAt: {
          ...(q.from && { gte: new Date(q.from) }),
          ...(q.to && { lte: new Date(q.to) }),
        },
      }),
    },
  };

  const [rows, total] = await Promise.all([
    prisma.checkin.findMany({
      ...where,
      orderBy: { checkedAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      select: { id: true, checkedAt: true },
    }),
    prisma.checkin.count({ where: where.where }),
  ]);

  const items: CheckinRecord[] = rows.map((r) => ({ id: r.id, checkedAt: r.checkedAt.toISOString() }));
  return { items, meta: { page: q.page, limit: q.limit, total } };
}

// ── today (user JWT) ──────────────────────────────────────────────────────
export async function getTodayCheckin(callerId: string, elderId: string) {
  await assertElderAccess(callerId, elderId);
  const r = await hasCheckedInToday(elderId);
  return { checked: r.checked, checkedAt: r.checkedAt ? r.checkedAt.toISOString() : null };
}

// ── streak (user JWT) ─────────────────────────────────────────────────────
export async function getStreak(callerId: string, elderId: string) {
  await assertElderAccess(callerId, elderId);
  const r = await computeStreak(elderId);
  return { streakDays: r.streakDays, lastCheckinAt: r.lastCheckinAt ? r.lastCheckinAt.toISOString() : null };
}
