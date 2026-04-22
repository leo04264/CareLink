import type { FastifyInstance } from 'fastify';
import type { ApiSuccess, HealthResponse } from '@carelink/shared';

// GET /health — used by Fly, uptime probes, and local sanity checks.
export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => {
    const body: ApiSuccess<HealthResponse> = {
      ok: true,
      data: {
        status: 'ok',
        ts: new Date().toISOString(),
        service: 'carelink-api',
        version: process.env.APP_VERSION ?? '0.1.0',
      },
    };
    return body;
  });
}
