import type { ErrorCode } from './errors';

// ── Response envelope ─────────────────────────────────────────────────────
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Pagination cursor ────────────────────────────────────────────────────
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

// ── Health (example wired in this PR) ─────────────────────────────────────
export interface HealthResponse {
  status: 'ok';
  ts: string;
  service: 'carelink-api';
  version: string;
}
