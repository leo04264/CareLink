// DTOs + JWT payload shapes for /auth. Shared between apps/api and mobile.

// ── JWT payloads (spec §9.2) ───────────────────────────────────────────────
export interface UserTokenPayload {
  sub: string; // User.id
  type: 'user';
  role: 'caregiver';
}

export interface ElderTokenPayload {
  sub: string; // Elder.id
  type: 'elder';
  elderId: string;
}

// ── Shared user shape returned on login/register ───────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── POST /auth/register ────────────────────────────────────────────────────
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// ── POST /auth/login ───────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// ── POST /auth/refresh ─────────────────────────────────────────────────────
export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string; // rotated
}

// ── POST /auth/logout ──────────────────────────────────────────────────────
export interface LogoutRequest {
  refreshToken: string;
}

// ── POST /auth/elder/pair ──────────────────────────────────────────────────
export interface ElderPairRequest {
  elderId: string;
}

export interface ElderPairResponse {
  pairCode: string;
  expiresAt: string; // ISO
}

// ── POST /auth/elder/verify ────────────────────────────────────────────────
export interface ElderVerifyRequest {
  pairCode: string;
  pushToken?: string;
  platform?: 'ios' | 'android' | 'web';
}

export interface ElderVerifyResponse {
  elderId: string;
  elderToken: string;
}
