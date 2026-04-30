import type {
  CheckinCreateRequest,
  CheckinCreateResponse,
  CheckinTodayResponse,
} from '@carelink/shared';
import { apiRequest } from './apiClient';

// Elder posts "I'm OK" — elder JWT. Returns the new row + streak.
export async function postCheckin(
  elderId: string,
  note?: string,
): Promise<CheckinCreateResponse> {
  const body: CheckinCreateRequest = note ? { note } : {};
  return apiRequest<CheckinCreateResponse>(`/elders/${elderId}/checkins`, {
    method: 'POST',
    body,
    auth: 'elder',
  });
}

// Caregiver reads today's checkin status. Used by dashboard polling.
export async function getTodayCheckin(elderId: string): Promise<CheckinTodayResponse> {
  return apiRequest<CheckinTodayResponse>(`/elders/${elderId}/checkins/today`);
}
