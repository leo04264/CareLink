import type { FastifyInstance } from 'fastify';
import { ErrorCodes } from '@carelink/shared';
import type { AuthUser, UserTokenPayload, ElderTokenPayload } from '@carelink/shared';
import { ApiException } from '../../plugins/error-handler';
import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from '../../lib/hash';
import { makeRefreshToken, JWT_CONFIG, ttlStringToMs } from '../../lib/jwt';
import { generatePairCode, PAIR_CODE_TTL_MS } from '../../lib/pair-code';
import type {
  RegisterInput,
  LoginInput,
  RefreshInput,
  LogoutInput,
  ElderPairInput,
  ElderVerifyInput,
} from './auth.schema';

function toAuthUser(u: { id: string; name: string; email: string }): AuthUser {
  return { id: u.id, name: u.name, email: u.email };
}

async function issueTokens(app: FastifyInstance, userId: string) {
  const payload: UserTokenPayload = { sub: userId, type: 'user', role: 'caregiver' };
  const accessToken = app.signUserToken(payload);
  const refreshToken = makeRefreshToken();
  const expiresAt = new Date(Date.now() + ttlStringToMs(JWT_CONFIG.refreshExpiresIn));
  await prisma.refreshToken.create({ data: { token: refreshToken, userId, expiresAt } });
  return { accessToken, refreshToken };
}

// ── register ───────────────────────────────────────────────────────────────
// On register we auto-create a Family and add the user as PRIMARY member so
// subsequent /elders and /family calls have somewhere to attach to.
export async function register(app: FastifyInstance, input: RegisterInput) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiException(ErrorCodes.ALREADY_EXISTS, 'Email already registered');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
      memberships: {
        create: {
          role: 'PRIMARY',
          family: { create: { name: `${input.name} 的家` } },
        },
      },
    },
  });

  const tokens = await issueTokens(app, user.id);
  return { user: toAuthUser(user), ...tokens };
}

// ── login ──────────────────────────────────────────────────────────────────
export async function login(app: FastifyInstance, input: LoginInput) {
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new ApiException(ErrorCodes.AUTH_INVALID_CREDENTIALS, 'Email or password incorrect');
  }
  const tokens = await issueTokens(app, user.id);
  return { user: toAuthUser(user), ...tokens };
}

// ── refresh ────────────────────────────────────────────────────────────────
// Rotates the refresh token — we revoke the one presented and issue a fresh pair.
export async function refresh(app: FastifyInstance, input: RefreshInput) {
  const record = await prisma.refreshToken.findUnique({ where: { token: input.refreshToken } });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new ApiException(ErrorCodes.AUTH_TOKEN_EXPIRED, 'Refresh token invalid or expired');
  }
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
  return issueTokens(app, record.userId);
}

// ── logout ─────────────────────────────────────────────────────────────────
// Best-effort revoke; we don't 404 if the token is already revoked/unknown
// (client may have lost it).
export async function logout(_app: FastifyInstance, input: LogoutInput) {
  await prisma.refreshToken.updateMany({
    where: { token: input.refreshToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ── elder pair ─────────────────────────────────────────────────────────────
// Caller must be authenticated as a user (checked by route-level preHandler).
// Guard that the elder belongs to one of the caller's families.
export async function elderPair(
  _app: FastifyInstance,
  callerUserId: string,
  input: ElderPairInput,
) {
  const elder = await prisma.elder.findUnique({
    where: { id: input.elderId },
    include: { family: { include: { members: { where: { userId: callerUserId } } } } },
  });
  if (!elder || elder.family.members.length === 0) {
    throw new ApiException(ErrorCodes.NOT_FOUND, 'Elder not found or not in your family');
  }

  const pairCode = generatePairCode();
  const expiresAt = new Date(Date.now() + PAIR_CODE_TTL_MS);

  await prisma.elder.update({
    where: { id: elder.id },
    data: { pairCode, pairCodeExpiresAt: expiresAt },
  });

  return { pairCode, expiresAt: expiresAt.toISOString() };
}

// ── elder verify ───────────────────────────────────────────────────────────
// Unauthenticated — the pair code IS the auth. Consumes the code on success.
export async function elderVerify(app: FastifyInstance, input: ElderVerifyInput) {
  const elder = await prisma.elder.findUnique({ where: { pairCode: input.pairCode } });
  if (!elder || !elder.pairCodeExpiresAt || elder.pairCodeExpiresAt < new Date()) {
    throw new ApiException(ErrorCodes.AUTH_PAIR_CODE_INVALID, 'Pair code invalid or expired');
  }

  await prisma.elder.update({
    where: { id: elder.id },
    data: {
      pairCode: null,
      pairCodeExpiresAt: null,
      deviceToken: input.pushToken ?? elder.deviceToken,
      platform: input.platform ?? elder.platform,
    },
  });

  const payload: ElderTokenPayload = { sub: elder.id, type: 'elder', elderId: elder.id };
  const elderToken = app.signElderToken(payload);
  return { elderId: elder.id, elderToken };
}
