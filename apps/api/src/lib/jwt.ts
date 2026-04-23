import { randomBytes } from 'node:crypto';
import type { UserTokenPayload, ElderTokenPayload } from '@carelink/shared';

export const JWT_CONFIG = {
  secret: requireEnv('JWT_SECRET'),
  accessExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  elderExpiresIn: process.env.JWT_ELDER_EXPIRES_IN ?? '90d',
};

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v || v.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing or too-short env ${key} (need ≥ 32 chars)`);
    }
    // In dev we silently fall back so `npm run dev:api` works without an .env
    return 'dev-only-insecure-secret-please-set-JWT_SECRET-env-var!!';
  }
  return v;
}

// Refresh tokens are opaque random strings (not JWT) stored in DB so we can
// revoke them on logout or rotation.
export function makeRefreshToken(): string {
  return randomBytes(32).toString('hex'); // 64 chars
}

// Convert "30d" / "15m" / "90d" into ms for expiry math on refresh tokens.
export function ttlStringToMs(s: string): number {
  const m = /^(\d+)\s*([smhd])$/i.exec(s.trim());
  if (!m) throw new Error(`Invalid TTL: ${s}`);
  const n = Number(m[1]);
  const unit = m[2]!.toLowerCase();
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}

export type { UserTokenPayload, ElderTokenPayload };
