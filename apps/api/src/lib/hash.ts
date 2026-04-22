import bcrypt from 'bcryptjs';

// bcryptjs is pure-JS (no native binary / no build tools required). Cost 10
// is the bcryptjs default and balances CPU cost vs user-perceived latency —
// ~60ms on a modern laptop. Don't drop below 10 in production.
const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
