import { randomBytes } from 'node:crypto';

// 32-byte hex = 64 chars. Matches the refresh-token format we already use so
// the Zod validation pattern and the mental model are the same.
export function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

// 7 days per spec §5.2 `/family/:id/invite`.
export const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
