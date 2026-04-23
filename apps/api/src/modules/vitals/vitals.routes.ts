import type { FastifyInstance } from 'fastify';
import type {
  ApiSuccess,
  BPRecord,
  BSRecord,
  ElderTokenPayload,
  UserTokenPayload,
  VitalsSummary,
} from '@carelink/shared';
import { createBPSchema, createBSSchema, elderIdParam, listQuery } from './vitals.schema';
import { createBP, createBS, getSummary, listBP, listBS } from './vitals.service';

type Caller = { type: 'user'; sub: string } | { type: 'elder'; elderId: string };

function asCaller(cu: UserTokenPayload | ElderTokenPayload): Caller {
  if (cu.type === 'elder') return { type: 'elder', elderId: cu.elderId };
  return { type: 'user', sub: cu.sub };
}

export async function registerVitalsRoutes(app: FastifyInstance): Promise<void> {
  // POST BP — user OR elder
  app.post('/elders/:elderId/vitals/blood-pressure', { preHandler: app.requireUserOrElder }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const input = createBPSchema.parse(req.body);
    const data = await createBP(asCaller((req as never as { currentUser: UserTokenPayload | ElderTokenPayload }).currentUser), elderId, input);
    const body: ApiSuccess<BPRecord> = { ok: true, data };
    return reply.status(201).send(body);
  });

  // GET BP list — user only
  app.get('/elders/:elderId/vitals/blood-pressure', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const q = listQuery.parse(req.query);
    const user = (req as never as { currentUser: UserTokenPayload }).currentUser;
    const data = await listBP(user.sub, elderId, q);
    const body: ApiSuccess<BPRecord[]> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // POST BS — user OR elder
  app.post('/elders/:elderId/vitals/blood-sugar', { preHandler: app.requireUserOrElder }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const input = createBSSchema.parse(req.body);
    const data = await createBS(asCaller((req as never as { currentUser: UserTokenPayload | ElderTokenPayload }).currentUser), elderId, input);
    const body: ApiSuccess<BSRecord> = { ok: true, data };
    return reply.status(201).send(body);
  });

  // GET BS list
  app.get('/elders/:elderId/vitals/blood-sugar', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const q = listQuery.parse(req.query);
    const user = (req as never as { currentUser: UserTokenPayload }).currentUser;
    const data = await listBS(user.sub, elderId, q);
    const body: ApiSuccess<BSRecord[]> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // GET summary
  app.get('/elders/:elderId/vitals/summary', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const user = (req as never as { currentUser: UserTokenPayload }).currentUser;
    const data = await getSummary(user.sub, elderId);
    const body: ApiSuccess<VitalsSummary> = { ok: true, data };
    return reply.status(200).send(body);
  });
}
