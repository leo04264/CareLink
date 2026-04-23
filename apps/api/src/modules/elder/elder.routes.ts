import type { FastifyInstance } from 'fastify';
import type {
  ApiSuccess,
  ElderStatusResponse,
  ElderSummary,
  ElderTokenPayload,
  GetElderResponse,
  UpdateElderResponse,
  UserTokenPayload,
} from '@carelink/shared';
import {
  createElderSchema,
  elderIdParam,
  familyIdParam,
  updateElderSchema,
  updatePushTokenSchema,
} from './elder.schema';
import {
  createElder,
  getElder,
  getElderStatus,
  updateElder,
  updatePushToken,
} from './elder.service';

const callerUserId = (req: { currentUser: UserTokenPayload }) => req.currentUser.sub;
const callerElderId = (req: { currentUser: ElderTokenPayload }) => req.currentUser.elderId;

export async function registerElderRoutes(app: FastifyInstance): Promise<void> {
  // POST /family/:familyId/elders
  app.post('/family/:familyId/elders', { preHandler: app.requireUser }, async (req, reply) => {
    const { familyId } = familyIdParam.parse(req.params);
    const input = createElderSchema.parse(req.body);
    const data = await createElder(callerUserId(req as never), familyId, input);
    const body: ApiSuccess<ElderSummary> = { ok: true, data };
    return reply.status(201).send(body);
  });

  // GET /elders/:elderId
  app.get('/elders/:elderId', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const data = await getElder(callerUserId(req as never), elderId);
    const body: ApiSuccess<GetElderResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // PUT /elders/:elderId
  app.put('/elders/:elderId', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const input = updateElderSchema.parse(req.body);
    const data = await updateElder(callerUserId(req as never), elderId, input);
    const body: ApiSuccess<UpdateElderResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // PUT /elders/:elderId/push-token — elder JWT only
  app.put('/elders/:elderId/push-token', { preHandler: app.requireElder }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const input = updatePushTokenSchema.parse(req.body);
    await updatePushToken(callerElderId(req as never), elderId, input);
    return reply.status(200).send({ ok: true, data: { updated: true } });
  });

  // GET /elders/:elderId/status — dashboard summary
  app.get('/elders/:elderId/status', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const data = await getElderStatus(callerUserId(req as never), elderId);
    const body: ApiSuccess<ElderStatusResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });
}
