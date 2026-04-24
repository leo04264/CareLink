import type { ISODate } from './family';

// ── Notification types match the Prisma enum (kept in sync with spec §4). ──
export const NotificationTypeValue = {
  CHECKIN: 'CHECKIN',
  MEDICATION: 'MEDICATION',
  MEDICATION_MISSED: 'MEDICATION_MISSED',
  SOS: 'SOS',
  APPOINTMENT: 'APPOINTMENT',
  CHECKIN_OVERDUE: 'CHECKIN_OVERDUE',
  VITALS_ALERT: 'VITALS_ALERT',
} as const;
export type NotificationTypeValue = (typeof NotificationTypeValue)[keyof typeof NotificationTypeValue];

export interface NotificationItem {
  id: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  data: unknown;
  isRead: boolean;
  createdAt: ISODate;
}

export interface NotificationListMeta {
  page: number;
  limit: number;
  total: number;
  unreadCount: number;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  meta: NotificationListMeta;
}

// ── Settings ──────────────────────────────────────────────────────────────
export interface NotificationSettings {
  checkin: boolean;
  medication: boolean;
  medicationMissed: boolean;
  sos: boolean;
  appointment: boolean;
  checkinOverdue: boolean;
  vitalsAlert: boolean;
  quietStart: string | null; // "HH:MM"
  quietEnd: string | null;
}

export type UpdateNotificationSettingsRequest = Partial<NotificationSettings>;

// ── Push tokens ───────────────────────────────────────────────────────────
export interface PushTokenRequest {
  token: string; // ExponentPushToken[...]
  platform: 'ios' | 'android' | 'web';
}

export interface PushTokenResponse {
  id: string;
  token: string;
  platform: string;
  createdAt: ISODate;
}
