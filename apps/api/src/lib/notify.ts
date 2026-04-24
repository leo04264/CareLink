import type { NotificationType } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { prisma } from './prisma';
import { sendPush } from './expo-push';

interface NotifyFamilyInput {
  elderId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: InputJsonValue;
}

// Map NotificationType → the boolean field name on NotificationSetting.
// SOS / VITALS_ALERT intentionally route to their own toggles so users can
// keep SOS on while silencing medication reminders, etc.
const TYPE_TO_PREF: Record<NotificationType, keyof {
  checkin: boolean;
  medication: boolean;
  medicationMissed: boolean;
  sos: boolean;
  appointment: boolean;
  checkinOverdue: boolean;
  vitalsAlert: boolean;
}> = {
  CHECKIN: 'checkin',
  MEDICATION: 'medication',
  MEDICATION_MISSED: 'medicationMissed',
  SOS: 'sos',
  APPOINTMENT: 'appointment',
  CHECKIN_OVERDUE: 'checkinOverdue',
  VITALS_ALERT: 'vitalsAlert',
};

// SOS always wakes you up, even during quiet hours. Everything else is
// politely suppressed from push between quietStart–quietEnd.
const BYPASS_QUIET = new Set<NotificationType>(['SOS']);

function isInQuietWindow(now: Date, start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const s = sh! * 60 + sm!;
  const e = eh! * 60 + em!;
  // Handles both "22:00–07:00" (overnight) and "12:00–14:00" (same day).
  return s < e ? cur >= s && cur < e : cur >= s || cur < e;
}

/**
 * Fan-out to every caregiver in the elder's family:
 *   1. write a Notification row (always — caregiver app can poll it)
 *   2. respect the user's NotificationSetting toggles + quiet hours
 *   3. push via Expo (no-op if EXPO_PUSH_ENABLED=false, see expo-push.ts)
 *
 * SOS bypasses quiet hours entirely. Missing NotificationSetting rows
 * are treated as the default (all on, quiet 22:00–07:00).
 */
export async function notifyFamily(input: NotifyFamilyInput): Promise<{ rows: number; pushed: number }> {
  const members = await prisma.familyMember.findMany({
    where: { family: { elders: { some: { id: input.elderId } } } },
    select: { userId: true },
  });
  if (members.length === 0) return { rows: 0, pushed: 0 };
  const userIds = members.map((m) => m.userId);

  // 1. Always write the rows first — this is the audit / poll source.
  const now = new Date();
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? undefined,
      createdAt: now,
    })),
  });

  // 2. Load each user's settings (or defaults) + push tokens in parallel.
  const [settings, tokens] = await Promise.all([
    prisma.notificationSetting.findMany({ where: { userId: { in: userIds } } }),
    prisma.pushToken.findMany({ where: { userId: { in: userIds } } }),
  ]);
  const settingsByUser = new Map(settings.map((s) => [s.userId, s]));
  const tokensByUser = new Map<string, string[]>();
  for (const t of tokens) {
    const arr = tokensByUser.get(t.userId) ?? [];
    arr.push(t.token);
    tokensByUser.set(t.userId, arr);
  }

  // 3. Build the target-token list respecting preferences.
  const prefKey = TYPE_TO_PREF[input.type];
  const bypassQuiet = BYPASS_QUIET.has(input.type);
  const targets: string[] = [];

  for (const userId of userIds) {
    const s = settingsByUser.get(userId);
    // Defaults: all on, quiet 22:00–07:00.
    const enabled = s ? (s as Record<string, unknown>)[prefKey] !== false : true;
    if (!enabled) continue;
    if (!bypassQuiet) {
      const quietStart = s ? s.quietStart ?? '22:00' : '22:00';
      const quietEnd = s ? s.quietEnd ?? '07:00' : '07:00';
      if (isInQuietWindow(now, quietStart, quietEnd)) continue;
    }
    const utoks = tokensByUser.get(userId) ?? [];
    targets.push(...utoks);
  }

  if (targets.length === 0) return { rows: userIds.length, pushed: 0 };

  const result = await sendPush({
    to: targets,
    title: input.title,
    body: input.body,
    data: { ...(input.data as Record<string, unknown> | undefined), type: input.type },
  });
  return { rows: userIds.length, pushed: result.sent };
}
