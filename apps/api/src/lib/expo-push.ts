import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export interface PushPayload {
  to: string[]; // list of Expo push tokens
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
}

// Toggled by env. Default: OFF — local dev should NOT spam the Expo push
// service. Set EXPO_PUSH_ENABLED=true in production .env to activate.
// Everything else stays identical (tokens still validated, shape still built)
// so the only difference is whether expo.sendPushNotificationsAsync is called.
const ENABLED = process.env.EXPO_PUSH_ENABLED === 'true';

export async function sendPush(payload: PushPayload): Promise<{ sent: number; skipped: number }> {
  const valid = payload.to.filter((t) => Expo.isExpoPushToken(t));
  const skipped = payload.to.length - valid.length;
  if (valid.length === 0) return { sent: 0, skipped };

  const messages: ExpoPushMessage[] = valid.map((token) => ({
    to: token,
    sound: payload.sound === null ? undefined : (payload.sound ?? 'default'),
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    ...(payload.badge !== undefined && { badge: payload.badge }),
  }));

  if (!ENABLED) {
    // eslint-disable-next-line no-console
    console.log('[expo-push:disabled]', { count: valid.length, title: payload.title });
    return { sent: valid.length, skipped };
  }

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[expo-push:error]', err);
    }
  }
  return { sent: valid.length, skipped };
}

export const EXPO_PUSH_ENABLED = ENABLED;
