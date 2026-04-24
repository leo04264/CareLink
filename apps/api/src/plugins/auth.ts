import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserTokenPayload, ElderTokenPayload } from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import { ApiException } from './error-handler';
import { JWT_CONFIG } from '../lib/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    requireUser: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireElder: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireUserOrElder: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    signUserToken: (p: UserTokenPayload) => string;
    signElderToken: (p: ElderTokenPayload) => string;
  }
  interface FastifyRequest {
    currentUser: UserTokenPayload | ElderTokenPayload;
  }
}

// Registers two JWT namespaces (user and elder) and exposes middleware
// `requireUser` / `requireElder` that attach the decoded payload to
// `request.user`, or throw a typed 401 via the error handler.
export default fp(async function authPlugin(app) {
  await app.register(fastifyJwt, {
    secret: JWT_CONFIG.secret,
    namespace: 'user',
    sign: { expiresIn: JWT_CONFIG.accessExpiresIn },
  });

  await app.register(fastifyJwt, {
    secret: JWT_CONFIG.secret,
    namespace: 'elder',
    sign: { expiresIn: JWT_CONFIG.elderExpiresIn },
  });

  app.decorate('requireUser', async function requireUser(req, _reply) {
    try {
      // @fastify/jwt v8 adds namespaced verifier on the request
      const payload = await (req as FastifyRequest & { userJwtVerify(): Promise<unknown> }).userJwtVerify();
      const p = payload as UserTokenPayload;
      if (p.type !== 'user') throw new Error('wrong-namespace');
      req.currentUser = p;
    } catch {
      throw new ApiException(ErrorCodes.AUTH_UNAUTHORIZED, 'Missing or invalid user token');
    }
  });

  app.decorate('requireElder', async function requireElder(req, _reply) {
    try {
      const payload = await (req as FastifyRequest & { elderJwtVerify(): Promise<unknown> }).elderJwtVerify();
      const p = payload as ElderTokenPayload;
      if (p.type !== 'elder') throw new Error('wrong-namespace');
      req.currentUser = p;
    } catch {
      throw new ApiException(ErrorCodes.AUTH_UNAUTHORIZED, 'Missing or invalid elder token');
    }
  });

  // Accepts either user or elder token. Used for endpoints where both sides
  // are valid senders (e.g. POST /vitals — elder enters via their own input
  // screen; caregiver enters via the health tab).
  app.decorate('requireUserOrElder', async function requireUserOrElder(req, _reply) {
    try {
      const payload = await (req as FastifyRequest & { userJwtVerify(): Promise<unknown> }).userJwtVerify();
      const p = payload as UserTokenPayload;
      if (p.type === 'user') {
        req.currentUser = p;
        return;
      }
    } catch { /* fall through to elder */ }

    try {
      const payload = await (req as FastifyRequest & { elderJwtVerify(): Promise<unknown> }).elderJwtVerify();
      const p = payload as ElderTokenPayload;
      if (p.type !== 'elder') throw new Error('wrong-namespace');
      req.currentUser = p;
    } catch {
      throw new ApiException(ErrorCodes.AUTH_UNAUTHORIZED, 'Missing or invalid token');
    }
  });

  app.decorate('signUserToken', function signUserToken(payload: UserTokenPayload): string {
    return (app as unknown as { jwt: { user: { sign: (p: object) => string } } }).jwt.user.sign(payload);
  });

  app.decorate('signElderToken', function signElderToken(payload: ElderTokenPayload): string {
    return (app as unknown as { jwt: { elder: { sign: (p: object) => string } } }).jwt.elder.sign(payload);
  });
});
