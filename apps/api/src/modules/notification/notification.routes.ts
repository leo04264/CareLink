import type { FastifyInstance } from 'fastify';
import type {
  ApiSuccess,
  NotificationListResponse,
  NotificationSettings,
  PushTokenResponse,
  UserTokenPayload,
} from '@carelink/shared';
import {
  listQuery,
  notifIdParam,
  pushTokenSchema,
  updateSettingsSchema,
  userIdParam,
} from './notification.schema';
import {
  getSettings,
  listNotifications,
  markAllRead,
  markRead,
  putSettings,
  registerPushToken,
} from './notification.service';

const caller = (req: { currentUser: UserTokenPayload }) => req.currentUser.sub;

export async function registerNotificationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/users/:userId/notifications', { preHandler: app.requireUser }, async (req, reply) => {
    const { userId } = userIdParam.parse(req.params);
    const q = listQuery.parse(req.query);
    const data = await listNotifications(caller(req as never), userId, q);
    const body: ApiSuccess<NotificationListResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  app.patch('/notifications/:notifId/read', { preHandler: app.requireUser }, async (req, reply) => {
    const { notifId } = notifIdParam.parse(req.params);
    await markRead(caller(req as never), notifId);
    return reply.status(200).send({ ok: true, data: { read: true } });
  });

  app.patch('/users/:userId/notifications/read-all', { preHandler: app.requireUser }, async (req, reply) => {
    const { userId } = userIdParam.parse(req.params);
    await markAllRead(caller(req as never), userId);
    return reply.status(200).send({ ok: true, data: { read: true } });
  });

  app.get('/users/:userId/notification-settings', { preHandler: app.requireUser }, async (req, reply) => {
    const { userId } = userIdParam.parse(req.params);
    const data = await getSettings(caller(req as never), userId);
    const body: ApiSuccess<NotificationSettings> = { ok: true, data };
    return reply.status(200).send(body);
  });

  app.put('/users/:userId/notification-settings', { preHandler: app.requireUser }, async (req, reply) => {
    const { userId } = userIdParam.parse(req.params);
    const input = updateSettingsSchema.parse(req.body);
    const data = await putSettings(caller(req as never), userId, input);
    const body: ApiSuccess<NotificationSettings> = { ok: true, data };
    return reply.status(200).send(body);
  });

  app.post('/users/:userId/push-tokens', { preHandler: app.requireUser }, async (req, reply) => {
    const { userId } = userIdParam.parse(req.params);
    const input = pushTokenSchema.parse(req.body);
    const data = await registerPushToken(caller(req as never), userId, input);
    const body: ApiSuccess<PushTokenResponse> = { ok: true, data };
    return reply.status(201).send(body);
  });
}
