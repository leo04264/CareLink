import type { CreateSosResponse, SosEventRecord, SosHistoryResponse, SosLocation } from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import { ApiException } from '../../plugins/error-handler';
import { prisma } from '../../lib/prisma';
import { assertElderAccess } from '../../lib/membership';
import { notifyFamily } from '../../lib/notify';
import type { CreateSosInput, HistoryQueryInput } from './sos.schema';

function parseLocation(s: string | null): SosLocation | null {
  if (!s) return null;
  try {
    const v = JSON.parse(s) as SosLocation;
    if (typeof v.lat === 'number' && typeof v.lng === 'number') return v;
  } catch { /* ignore */ }
  return null;
}

function toRecord(e: {
  id: string;
  triggeredAt: Date;
  acknowledgedAt: Date | null;
  location: string | null;
  acknowledgedBy: { id: string; name: string } | null;
}): SosEventRecord {
  return {
    id: e.id,
    triggeredAt: e.triggeredAt.toISOString(),
    acknowledgedAt: e.acknowledgedAt ? e.acknowledgedAt.toISOString() : null,
    acknowledgedBy: e.acknowledgedBy ? { id: e.acknowledgedBy.id, name: e.acknowledgedBy.name } : null,
    location: parseLocation(e.location),
  };
}

// ── trigger (elder JWT) ───────────────────────────────────────────────────
export async function triggerSos(callerElderId: string, elderId: string, input: CreateSosInput): Promise<CreateSosResponse> {
  if (callerElderId !== elderId) {
    throw new ApiException(ErrorCodes.AUTH_UNAUTHORIZED, 'Elder token does not match requested elderId');
  }

  const elder = await prisma.elder.findUnique({
    where: { id: elderId },
    select: { name: true, familyId: true },
  });
  if (!elder) throw new ApiException(ErrorCodes.NOT_FOUND, 'Elder not found');

  const event = await prisma.sosEvent.create({
    data: {
      elderId,
      location: input.location ? JSON.stringify(input.location) : null,
    },
  });

  // Notify every caregiver in the family. TODO(PR K): real push + SMS fallback
  // + 119 confirmation flow — currently only writes Notification rows.
  const members = await prisma.familyMember.findMany({
    where: { familyId: elder.familyId },
    include: { user: { select: { id: true, name: true } } },
  });
  const notifiedMembers = members.map((m) => ({ userId: m.user.id, name: m.user.name }));

  await notifyFamily({
    elderId,
    type: 'SOS',
    title: `🚨 ${elder.name} 觸發 SOS`,
    body: input.location ? `位置：${input.location.lat.toFixed(4)}, ${input.location.lng.toFixed(4)}` : '請立即聯繫',
    data: { sosId: event.id, location: input.location ?? null },
  });

  return {
    id: event.id,
    triggeredAt: event.triggeredAt.toISOString(),
    notifiedMembers,
  };
}

// ── history (user JWT) ────────────────────────────────────────────────────
export async function listHistory(callerId: string, elderId: string, q: HistoryQueryInput): Promise<SosHistoryResponse> {
  await assertElderAccess(callerId, elderId);
  const where = { elderId };
  const [rows, total] = await Promise.all([
    prisma.sosEvent.findMany({
      where,
      orderBy: { triggeredAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: { acknowledgedBy: { select: { id: true, name: true } } },
    }),
    prisma.sosEvent.count({ where }),
  ]);
  return {
    items: rows.map(toRecord),
    meta: { page: q.page, limit: q.limit, total },
  };
}

// ── acknowledge (user JWT) ────────────────────────────────────────────────
export async function acknowledgeSos(callerId: string, sosId: string) {
  const event = await prisma.sosEvent.findUnique({
    where: { id: sosId },
    select: { id: true, elderId: true, acknowledgedAt: true },
  });
  if (!event) throw new ApiException(ErrorCodes.NOT_FOUND, 'SOS event not found');

  // Reuse the elder-family guard so outsiders can't ACK.
  const elder = await prisma.elder.findUniqueOrThrow({
    where: { id: event.elderId },
    select: { familyId: true },
  });
  const m = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId: callerId, familyId: elder.familyId } },
  });
  if (!m) throw new ApiException(ErrorCodes.NOT_FOUND, 'SOS event not found');

  if (event.acknowledgedAt) {
    // Idempotent — don't overwrite the first ACK timestamp.
    return;
  }
  await prisma.sosEvent.update({
    where: { id: event.id },
    data: {
      acknowledgedAt: new Date(),
      acknowledgedById: callerId,
    },
  });
}
