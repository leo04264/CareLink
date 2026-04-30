import type {
  ElderPairRequest,
  ElderPairResponse,
  ElderVerifyRequest,
  ElderVerifyResponse,
  ElderStatusResponse,
} from '@carelink/shared';
import { apiRequest } from './apiClient';
import { storage, StorageKeys } from './storage';

// Caregiver mints a 6-char pair code for a specific elder. User JWT.
export async function mintPairCode(elderId: string): Promise<ElderPairResponse> {
  const body: ElderPairRequest = { elderId };
  return apiRequest<ElderPairResponse>('/auth/elder/pair', {
    method: 'POST',
    body,
  });
}

// Elder app exchanges the pair code for a long-lived elderToken. No
// auth needed — the code IS the auth. Persists the token + elderId so
// subsequent calls (checkin, vitals) can run with auth: 'elder'.
export async function verifyPairCode(
  pairCode: string,
  pushToken?: string,
  platform?: 'ios' | 'android' | 'web',
): Promise<ElderVerifyResponse> {
  const body: ElderVerifyRequest = { pairCode, pushToken, platform };
  const data = await apiRequest<ElderVerifyResponse>('/auth/elder/verify', {
    method: 'POST',
    body,
    auth: false,
  });
  await storage.set(StorageKeys.elderToken, data.elderToken);
  await storage.set(StorageKeys.elderId, data.elderId);
  return data;
}

export async function clearElderSession(): Promise<void> {
  await storage.multiRemove([StorageKeys.elderToken, StorageKeys.elderId]);
}

// User JWT — caregiver-side dashboard summary. Used by C4 polling.
export async function getElderStatus(elderId: string): Promise<ElderStatusResponse> {
  return apiRequest<ElderStatusResponse>(`/elders/${elderId}/status`);
}
