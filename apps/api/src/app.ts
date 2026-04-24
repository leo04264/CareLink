import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import authPlugin from './plugins/auth';
import { registerHealthRoutes } from './modules/health/health.routes';
import { registerAuthRoutes } from './modules/auth/auth.routes';
import { registerFamilyRoutes } from './modules/family/family.routes';
import { registerElderRoutes } from './modules/elder/elder.routes';
import { registerCheckinRoutes } from './modules/checkin/checkin.routes';
import { registerMedicationRoutes } from './modules/medication/medication.routes';
import { registerVitalsRoutes } from './modules/vitals/vitals.routes';
import { registerAppointmentRoutes } from './modules/appointment/appointment.routes';
import { registerSosRoutes } from './modules/sos/sos.routes';
import { registerNotificationRoutes } from './modules/notification/notification.routes';
import { registerMediaRoutes } from './modules/media/media.routes';
import { ensureBucketReady } from './lib/r2';
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
  await app.register(registerMedicationRoutes);
  await app.register(registerVitalsRoutes);
  await app.register(registerAppointmentRoutes);
  await app.register(registerSosRoutes);
  await app.register(registerNotificationRoutes);
  await app.register(registerMediaRoutes);

  // Idempotent bucket setup. On MinIO this creates carelink-media and sets
  // a public-read policy; on R2 the bucket is pre-created so this becomes
  // a no-op. Failures are logged but don't block boot.
  void ensureBucketReady().catch((err) => app.log.warn({ err }, 'r2 bucket setup'));

  return app;
}
