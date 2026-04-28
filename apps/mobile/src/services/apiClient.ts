import type { ApiResponse, ApiError } from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import { getApiBaseUrl } from './apiConfig';
import { storage, StorageKeys } from './storage';

// Fetch wrapper that:
//  - prepends the resolved base URL
//  - injects Authorization: Bearer <accessToken> if present
//  - unwraps the { ok, data } / { ok, error } envelope and throws ApiClientError
//    for non-ok responses (incl. network failures)
//
// Token refresh is intentionally NOT handled here yet — Commit 3's
// AuthContext owns refresh logic so the client stays a dumb transport.

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean; // default true — set false for /auth/login etc.
}

async function authHeader(): Promise<Record<string, string>> {
  const token = await storage.get(StorageKeys.accessToken);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new ApiClientError(
      'No API base URL configured (set EXPO_PUBLIC_API_URL or run via Expo dev server).',
      ErrorCodes.INTERNAL_ERROR,
      0,
    );
  }

  const { body, auth = true, headers, ...rest } = opts;
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(auth ? await authHeader() : {}),
    ...((headers as Record<string, string>) ?? {}),
  };

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new ApiClientError(
      `Network request failed: ${(e as Error).message}`,
      ErrorCodes.INTERNAL_ERROR,
      0,
      e,
    );
  }

  let parsed: ApiResponse<T>;
  try {
    parsed = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      `Non-JSON response (HTTP ${res.status})`,
      ErrorCodes.INTERNAL_ERROR,
      res.status,
    );
  }

  if (!parsed.ok) {
    const err = (parsed as ApiError).error;
    throw new ApiClientError(err.message, err.code, res.status, err.details);
  }

  return parsed.data;
}
