// DTOs for /checkins (spec §5.4). Re-uses ISODate type from family.ts.
import type { ISODate } from './family';

export interface CheckinRecord {
  id: string;
  checkedAt: ISODate;
}

export interface CheckinCreateResponse {
  id: string;
  checkedAt: ISODate;
  streakDays: number;
}

export interface CheckinCreateRequest {
  note?: string | null;
}

export interface CheckinListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface CheckinListResponse {
  items: CheckinRecord[];
  meta: CheckinListMeta;
}

export interface CheckinTodayResponse {
  checked: boolean;
  checkedAt: ISODate | null;
}

export interface CheckinStreakResponse {
  streakDays: number;
  lastCheckinAt: ISODate | null;
}

// ── Notification (read-only list — full module is PR K) ────────────────────
export interface NotificationRecord {
  id: string;
  type: 'CHECKIN' | 'MEDICATION' | 'MEDICATION_MISSED' | 'SOS' | 'APPOINTMENT' | 'CHECKIN_OVERDUE';
  title: string;
  body: string;
  data: unknown;
  isRead: boolean;
  createdAt: ISODate;
}
