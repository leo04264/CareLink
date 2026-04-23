import type { FastifyInstance } from 'fastify';
import type {
  ApiSuccess,
  RegisterResponse,
  LoginResponse,
  RefreshResponse,
  ElderPairResponse,
  ElderVerifyResponse,
  UserTokenPayload,
} from '@carelink/shared';
import {
  elderPairSchema,
  elderVerifySchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from './auth.schema';
import { elderPair, elderVerify, login, logout, refresh, register } from './auth.service';

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/register
  app.post('/auth/register', async (req, reply) => {
    const input = registerSchema.parse(req.body);
    const data = await register(app, input);
    const body: ApiSuccess<RegisterResponse> = { ok: true, data };
    return reply.status(201).send(body);
  });

  // POST /auth/login
  app.post('/auth/login', async (req, reply) => {
    const input = loginSchema.parse(req.body);
    const data = await login(app, input);
    const body: ApiSuccess<LoginResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // POST /auth/refresh
  app.post('/auth/refresh', async (req, reply) => {
    const input = refreshSchema.parse(req.body);
    const data = await refresh(app, input);
    const body: ApiSuccess<RefreshResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // POST /auth/logout — revoke the supplied refresh token
  app.post('/auth/logout', { preHandler: app.requireUser }, async (req, reply) => {
    const input = logoutSchema.parse(req.body);
    await logout(app, input);
    return reply.status(200).send({ ok: true, data: { revoked: true } });
  });

  // POST /auth/elder/pair — caregiver requests a 6-char code for an elder
  app.post('/auth/elder/pair', { preHandler: app.requireUser }, async (req, reply) => {
    const input = elderPairSchema.parse(req.body);
    const caller = req.currentUser as UserTokenPayload;
    const data = await elderPair(app, caller.sub, input);
    const body: ApiSuccess<ElderPairResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // POST /auth/elder/verify — unauthenticated; pair code IS the auth
  app.post('/auth/elder/verify', async (req, reply) => {
    const input = elderVerifySchema.parse(req.body);
    const data = await elderVerify(app, input);
    const body: ApiSuccess<ElderVerifyResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });
}
