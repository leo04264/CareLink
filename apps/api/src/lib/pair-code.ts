import { randomInt } from 'node:crypto';

// Omits ambiguous characters (0, O, 1, I, L) so elders can read them aloud.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generatePairCode(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
}

export const PAIR_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
