import type { FastifyInstance } from 'fastify';
import type {
  ApiSuccess,
  ElderTokenPayload,
  MedicationDetail,
  MedicationListResponse,
  MedicationLogListResponse,
  UserTokenPayload,
} from '@carelink/shared';
import {
  createLogSchema,
  createMedSchema,
  elderIdParam,
  logsQuery,
  medIdParam,
  medSchedParam,
  pauseSchema,
  scheduleInput,
  updateMedSchema,
  updateScheduleSchema,
} from './medication.schema';
import {
  addSchedule,
  createMedication,
  deleteSchedule,
  listLogs,
  listMedications,
  logDose,
  pauseMedication,
  softDeleteMedication,
  updateMedication,
  updateSchedule,
} from './medication.service';

const callerUser = (req: { currentUser: UserTokenPayload }) => req.currentUser.sub;
const callerElder = (req: { currentUser: ElderTokenPayload }) => req.currentUser.elderId;

export async function registerMedicationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/elders/:elderId/medications', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const data = await listMedications(callerUser(req as never), elderId);
    const body: ApiSuccess<MedicationListResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  app.post('/elders/:elderId/medications', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const input = createMedSchema.parse(req.body);
    const data = await createMedication(callerUser(req as never), elderId, input);
    const body: ApiSuccess<MedicationDetail> = { ok: true, data };
    return reply.status(201).send(body);
  });

  app.put('/medications/:medId', { preHandler: app.requireUser }, async (req, reply) => {
    const { medId } = medIdParam.parse(req.params);
    const input = updateMedSchema.parse(req.body);
    const data = await updateMedication(callerUser(req as never), medId, input);
    return reply.status(200).send({ ok: true, data });
  });

  app.delete('/medications/:medId', { preHandler: app.requireUser }, async (req, reply) => {
    const { medId } = medIdParam.parse(req.params);
    await softDeleteMedication(callerUser(req as never), medId);
    return reply.status(200).send({ ok: true, data: { deleted: true } });
  });

  app.patch('/medications/:medId/pause', { preHandler: app.requireUser }, async (req, reply) => {
    const { medId } = medIdParam.parse(req.params);
    const input = pauseSchema.parse(req.body);
    await pauseMedication(callerUser(req as never), medId, input);
    return reply.status(200).send({ ok: true, data: { paused: input.pause } });
  });

  app.post('/medications/:medId/schedules', { preHandler: app.requireUser }, async (req, reply) => {
    const { medId } = medIdParam.parse(req.params);
    const input = scheduleInput.parse(req.body);
    const data = await addSchedule(callerUser(req as never), medId, input);
    return reply.status(201).send({ ok: true, data });
  });

  app.put('/medications/:medId/schedules/:schedId', { preHandler: app.requireUser }, async (req, reply) => {
    const { medId, schedId } = medSchedParam.parse(req.params);
    const input = updateScheduleSchema.parse(req.body);
    const data = await updateSchedule(callerUser(req as never), medId, schedId, input);
    return reply.status(200).send({ ok: true, data });
  });

  app.delete('/medications/:medId/schedules/:schedId', { preHandler: app.requireUser }, async (req, reply) => {
    const { medId, schedId } = medSchedParam.parse(req.params);
    await deleteSchedule(callerUser(req as never), medId, schedId);
    return reply.status(200).send({ ok: true, data: { deleted: true } });
  });

  // Elder logs their own dose (button + camera flow in ElderMedication.js)
  app.post('/medications/:medId/logs', { preHandler: app.requireElder }, async (req, reply) => {
    const { medId } = medIdParam.parse(req.params);
    const input = createLogSchema.parse(req.body);
    const data = await logDose(callerElder(req as never), medId, input);
    return reply.status(201).send({ ok: true, data });
  });

  app.get('/elders/:elderId/medication-logs', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const q = logsQuery.parse(req.query);
    const data = await listLogs(callerUser(req as never), elderId, q);
    const body: ApiSuccess<MedicationLogListResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });
}
