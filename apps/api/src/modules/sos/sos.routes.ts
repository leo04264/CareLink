import type { FastifyInstance } from 'fastify';
import type {
  ApiSuccess,
  CreateSosResponse,
  ElderTokenPayload,
  SosHistoryResponse,
  UserTokenPayload,
} from '@carelink/shared';
import { createSosSchema, elderIdParam, historyQuery, sosIdParam } from './sos.schema';
import { acknowledgeSos, listHistory, triggerSos } from './sos.service';

const callerUser = (req: { currentUser: UserTokenPayload }) => req.currentUser.sub;
const callerElder = (req: { currentUser: ElderTokenPayload }) => req.currentUser.elderId;

export async function registerSosRoutes(app: FastifyInstance): Promise<void> {
  // POST /elders/:elderId/sos — elder JWT
  app.post('/elders/:elderId/sos', { preHandler: app.requireElder }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const input = createSosSchema.parse(req.body ?? {});
    const data = await triggerSos(callerElder(req as never), elderId, input);
    const body: ApiSuccess<CreateSosResponse> = { ok: true, data };
    return reply.status(201).send(body);
  });

  // GET /elders/:elderId/sos/history — user JWT
  app.get('/elders/:elderId/sos/history', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const q = historyQuery.parse(req.query);
    const data = await listHistory(callerUser(req as never), elderId, q);
    const body: ApiSuccess<SosHistoryResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // PATCH /sos/:sosId/acknowledge — user JWT
  app.patch('/sos/:sosId/acknowledge', { preHandler: app.requireUser }, async (req, reply) => {
    const { sosId } = sosIdParam.parse(req.params);
    await acknowledgeSos(callerUser(req as never), sosId);
    return reply.status(200).send({ ok: true, data: { acknowledged: true } });
  });
}
