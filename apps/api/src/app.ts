import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import authPlugin from './plugins/auth';
import { registerHealthRoutes } from './modules/health/health.routes';
import { registerAuthRoutes } from './modules/auth/auth.routes';
import { registerFamilyRoutes } from './modules/family/family.routes';
import { registerElderRoutes } from './modules/elder/elder.routes';
import { registerCheckinRoutes } from './modules/checkin/checkin.routes';
import { registerErrorHandler } from './plugins/error-handler';

export interface BuildAppOptions {
  logger?: boolean | object;
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const isDev = process.env.NODE_ENV !== 'production';

  const app = Fastify({
    logger:
      opts.logger ??
      (isDev
        ? { transport: { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } } }
        : true),
    trustProxy: true,
  });

  await app.register(cors, {
    origin: true, // tighten before launch; see spec §9
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
  });

  registerErrorHandler(app);
  await app.register(authPlugin);
  await app.register(registerHealthRoutes);
  await app.register(registerAuthRoutes);
  await app.register(registerFamilyRoutes);
  await app.register(registerElderRoutes);
  await app.register(registerCheckinRoutes);

  return app;
}
