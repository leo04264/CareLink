import type { FastifyInstance } from 'fastify';
import type { ApiSuccess, AppointmentRecord, UserTokenPayload } from '@carelink/shared';
import {
  apptIdParam,
  completeSchema,
  createApptSchema,
  elderIdParam,
  listQuery,
  updateApptSchema,
} from './appointment.schema';
import {
  completeAppointment,
  createAppointment,
  deleteAppointment,
  listAppointments,
  updateAppointment,
} from './appointment.service';

const callerUser = (req: { currentUser: UserTokenPayload }) => req.currentUser.sub;

export async function registerAppointmentRoutes(app: FastifyInstance): Promise<void> {
  app.get('/elders/:elderId/appointments', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const q = listQuery.parse(req.query);
    const data = await listAppointments(callerUser(req as never), elderId, q);
    const body: ApiSuccess<AppointmentRecord[]> = { ok: true, data };
    return reply.status(200).send(body);
  });

  app.post('/elders/:elderId/appointments', { preHandler: app.requireUser }, async (req, reply) => {
    const { elderId } = elderIdParam.parse(req.params);
    const input = createApptSchema.parse(req.body);
    const data = await createAppointment(callerUser(req as never), elderId, input);
    const body: ApiSuccess<AppointmentRecord> = { ok: true, data };
    return reply.status(201).send(body);
  });

  app.put('/appointments/:apptId', { preHandler: app.requireUser }, async (req, reply) => {
    const { apptId } = apptIdParam.parse(req.params);
    const input = updateApptSchema.parse(req.body);
    const data = await updateAppointment(callerUser(req as never), apptId, input);
    return reply.status(200).send({ ok: true, data });
  });

  app.delete('/appointments/:apptId', { preHandler: app.requireUser }, async (req, reply) => {
    const { apptId } = apptIdParam.parse(req.params);
    await deleteAppointment(callerUser(req as never), apptId);
    return reply.status(200).send({ ok: true, data: { deleted: true } });
  });

  app.patch('/appointments/:apptId/complete', { preHandler: app.requireUser }, async (req, reply) => {
    const { apptId } = apptIdParam.parse(req.params);
    const input = completeSchema.parse(req.body ?? {});
    const data = await completeAppointment(callerUser(req as never), apptId, input);
    return reply.status(200).send({ ok: true, data });
  });
}
