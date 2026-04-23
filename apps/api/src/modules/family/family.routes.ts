import type { FastifyInstance } from 'fastify';
import type {
  ApiSuccess,
  CreateFamilyResponse,
  CreateInviteResponse,
  GetFamilyResponse,
  JoinFamilyResponse,
  UserTokenPayload,
} from '@carelink/shared';
import {
  createFamilySchema,
  familyIdParam,
  joinFamilySchema,
  memberParams,
  updateRoleSchema,
} from './family.schema';
import {
  createFamily,
  createInvite,
  getFamily,
  joinFamily,
  removeMember,
  updateMemberRole,
} from './family.service';

const callerId = (req: { currentUser: UserTokenPayload }) => req.currentUser.sub;

export async function registerFamilyRoutes(app: FastifyInstance): Promise<void> {
  // POST /family
  app.post('/family', { preHandler: app.requireUser }, async (req, reply) => {
    const input = createFamilySchema.parse(req.body);
    const data = await createFamily(callerId(req as never), input);
    const body: ApiSuccess<CreateFamilyResponse> = { ok: true, data };
    return reply.status(201).send(body);
  });

  // GET /family/:familyId
  app.get('/family/:familyId', { preHandler: app.requireUser }, async (req, reply) => {
    const { familyId } = familyIdParam.parse(req.params);
    const data = await getFamily(callerId(req as never), familyId);
    const body: ApiSuccess<GetFamilyResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // POST /family/:familyId/invite
  app.post('/family/:familyId/invite', { preHandler: app.requireUser }, async (req, reply) => {
    const { familyId } = familyIdParam.parse(req.params);
    const data = await createInvite(callerId(req as never), familyId);
    const body: ApiSuccess<CreateInviteResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // POST /family/join
  app.post('/family/join', { preHandler: app.requireUser }, async (req, reply) => {
    const input = joinFamilySchema.parse(req.body);
    const data = await joinFamily(callerId(req as never), input);
    const body: ApiSuccess<JoinFamilyResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // PUT /family/:familyId/members/:userId/role
  app.put('/family/:familyId/members/:userId/role', { preHandler: app.requireUser }, async (req, reply) => {
    const { familyId, userId } = memberParams.parse(req.params);
    const input = updateRoleSchema.parse(req.body);
    await updateMemberRole(callerId(req as never), familyId, userId, input);
    return reply.status(200).send({ ok: true, data: { updated: true } });
  });

  // DELETE /family/:familyId/members/:userId
  app.delete('/family/:familyId/members/:userId', { preHandler: app.requireUser }, async (req, reply) => {
    const { familyId, userId } = memberParams.parse(req.params);
    await removeMember(callerId(req as never), familyId, userId);
    return reply.status(200).send({ ok: true, data: { removed: true } });
  });
}
