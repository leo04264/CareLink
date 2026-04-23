import type { FastifyInstance } from 'fastify';
import type {
  ApiSuccess,
  CheckinCreateResponse,
  CheckinListResponse,
  CheckinStreakResponse,
  CheckinTodayResponse,
  ElderTokenPayload,
  UserTokenPayload,
} from '@carelink/shared';
import {
  createCheckinSchema,
  elderIdParam,
  listCheckinsQuery,
} from './checkin.schema';
import {
  createCheckin,
  getStreak,
  getTodayCheckin,
  listCheckins,
} from './checkin.service';

const callerUser = (req: { currentUser: UserTokenPayload }) => req.currentUser.sub;
const callerElder = (req: { currentUser: ElderTokenPayload }) => req.currentUser.elderId;

export async function registerCheckinRoutes(app: FastifyInstance): Promise<void> {
  // POST /elders/:elderId/checkins — elder JWT
  app.post('/elders/:elderId/checkins', { preHandler: app.requireElder }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const input = createCheckinSchema.parse(req.body ?? {});
    const data = await createCheckin(callerElder(req as never), elderId, input);
    const body: ApiSuccess<CheckinCreateResponse> = { ok: true, data };
    return reply.status(201).send(body);
  });

  // GET /elders/:elderId/checkins — user JWT
  app.get('/elders/:elderId/checkins', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const q = listCheckinsQuery.parse(req.query);
    const data = await listCheckins(callerUser(req as never), elderId, q);
    const body: ApiSuccess<CheckinListResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // GET /elders/:elderId/checkins/today — user JWT
  app.get('/elders/:elderId/checkins/today', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const data = await getTodayCheckin(callerUser(req as never), elderId);
    const body: ApiSuccess<CheckinTodayResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // GET /elders/:elderId/checkins/streak — user JWT
  app.get('/elders/:elderId/checkins/streak', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const data = await getStreak(callerUser(req as never), elderId);
    const body: ApiSuccess<CheckinStreakResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });
}
