import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshResponse,
} from '@carelink/shared';
import { apiRequest } from './apiClient';
import { storage, StorageKeys } from './storage';

// Wraps the live /auth/* endpoints and persists tokens + user in storage.
// Token refresh logic lives in AuthContext (Commit 3) — this file is a
// thin transport that AuthContext composes.

export async function login(email: string, password: string): Promise<LoginResponse> {
  const body: LoginRequest = { email, password };
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body,
    auth: false,
  });
  await persistSession(data.user, data.accessToken, data.refreshToken);
  return data;
}

export async function register(name: string, email: string, password: string): Promise<RegisterResponse> {
  const body: RegisterRequest = { name, email, password };
  const data = await apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body,
    auth: false,
  });
  await persistSession(data.user, data.accessToken, data.refreshToken);
  return data;
}

export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  const data = await apiRequest<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
  });
  await storage.set(StorageKeys.accessToken, data.accessToken);
  await storage.set(StorageKeys.refreshToken, data.refreshToken);
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = await storage.get(StorageKeys.refreshToken);
  if (refreshToken) {
    try {
      await apiRequest<{ ok: true }>('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      });
    } catch {
      // Best-effort. Even if server logout fails we still clear locally.
    }
  }
  await storage.multiRemove([
    StorageKeys.accessToken,
    StorageKeys.refreshToken,
    StorageKeys.user,
  ]);
}

export async function loadStoredSession(): Promise<{
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
} | null> {
  const [userRaw, accessToken, refreshToken] = await Promise.all([
    storage.get(StorageKeys.user),
    storage.get(StorageKeys.accessToken),
    storage.get(StorageKeys.refreshToken),
  ]);
  if (!userRaw || !accessToken || !refreshToken) return null;
  try {
    return { user: JSON.parse(userRaw) as AuthUser, accessToken, refreshToken };
  } catch {
    return null;
  }
}

async function persistSession(user: AuthUser, accessToken: string, refreshToken: string) {
  await storage.set(StorageKeys.user, JSON.stringify(user));
  await storage.set(StorageKeys.accessToken, accessToken);
  await storage.set(StorageKeys.refreshToken, refreshToken);
}
