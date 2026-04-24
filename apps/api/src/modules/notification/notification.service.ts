import type {
  NotificationItem,
  NotificationListResponse,
  NotificationSettings,
  NotificationTypeValue,
  PushTokenResponse,
} from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import { ApiException } from '../../plugins/error-handler';
import { prisma } from '../../lib/prisma';
import type { ListQueryInput, PushTokenInput, UpdateSettingsInput } from './notification.schema';

// Rule of thumb for every endpoint in this module: caller can only see /
// change their own resources. Other users' notifications / settings / tokens
// are strictly off-limits.
function assertSelf(callerId: string, userId: string): void {
  if (callerId !== userId) {
    throw new ApiException(ErrorCodes.AUTH_UNAUTHORIZED, 'Cannot access another user');
  }
}

// ── list ──────────────────────────────────────────────────────────────────
export async function listNotifications(
  callerId: string,
  userId: string,
  q: ListQueryInput,
): Promise<NotificationListResponse> {
  assertSelf(callerId, userId);

  const where = { userId, ...(q.unread ? { isRead: false } : {}) };
  const [rows, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  const items: NotificationItem[] = rows.map((r) => ({
    id: r.id,
    type: r.type as NotificationTypeValue,
    title: r.title,
    body: r.body,
    data: r.data,
    isRead: r.isRead,
    createdAt: r.createdAt.toISOString(),
  }));
  return { items, meta: { page: q.page, limit: q.limit, total, unreadCount } };
}

// ── mark one read (idempotent) ────────────────────────────────────────────
export async function markRead(callerId: string, notifId: string) {
  const row = await prisma.notification.findUnique({ where: { id: notifId } });
  if (!row) throw new ApiException(ErrorCodes.NOT_FOUND, 'Notification not found');
  if (row.userId !== callerId) {
    // Don't leak existence; 404 rather than 401.
    throw new ApiException(ErrorCodes.NOT_FOUND, 'Notification not found');
  }
  if (row.isRead) return; // idempotent
  await prisma.notification.update({ where: { id: notifId }, data: { isRead: true } });
}

// ── mark all read ─────────────────────────────────────────────────────────
export async function markAllRead(callerId: string, userId: string) {
  assertSelf(callerId, userId);
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

// ── settings ──────────────────────────────────────────────────────────────
const DEFAULTS: NotificationSettings = {
  checkin: true,
  medication: true,
  medicationMissed: true,
  sos: true,
  appointment: true,
  checkinOverdue: true,
  vitalsAlert: true,
  quietStart: '22:00',
  quietEnd: '07:00',
};

function toSettings(row: {
  checkin: boolean;
  medication: boolean;
  medicationMissed: boolean;
  sos: boolean;
  appointment: boolean;
  checkinOverdue: boolean;
  vitalsAlert: boolean;
  quietStart: string | null;
  quietEnd: string | null;
}): NotificationSettings {
  return { ...row };
}

export async function getSettings(callerId: string, userId: string): Promise<NotificationSettings> {
  assertSelf(callerId, userId);
  const row = await prisma.notificationSetting.findUnique({ where: { userId } });
  return row ? toSettings(row) : DEFAULTS;
}

export async function putSettings(
  callerId: string,
  userId: string,
  input: UpdateSettingsInput,
): Promise<NotificationSettings> {
  assertSelf(callerId, userId);
  const upserted = await prisma.notificationSetting.upsert({
    where: { userId },
    create: { userId, ...DEFAULTS, ...input },
    update: input,
  });
  return toSettings(upserted);
}

// ── push tokens ───────────────────────────────────────────────────────────
export async function registerPushToken(
  callerId: string,
  userId: string,
  input: PushTokenInput,
): Promise<PushTokenResponse> {
  assertSelf(callerId, userId);
  // unique on token: if the same device re-registers, update the owner +
  // platform + updatedAt rather than erroring.
  const row = await prisma.pushToken.upsert({
    where: { token: input.token },
    create: { userId, token: input.token, platform: input.platform },
    update: { userId, platform: input.platform },
  });
  return {
    id: row.id,
    token: row.token,
    platform: row.platform,
    createdAt: row.createdAt.toISOString(),
  };
}
