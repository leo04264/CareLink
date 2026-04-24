import type { FastifyInstance } from 'fastify';
import type {
  ApiSuccess,
  ElderTokenPayload,
  MediaConfirmResponse,
  MediaUploadUrlResponse,
  UserTokenPayload,
} from '@carelink/shared';
import { confirmSchema, uploadUrlSchema } from './media.schema';
import { confirmUpload, issueUploadUrl } from './media.service';

export async function registerMediaRoutes(app: FastifyInstance): Promise<void> {
  // POST /media/upload-url — user OR elder. The service layer trusts the
  // token type as audit; it doesn't authorize by context since either
  // caller type may legitimately upload to any context.
  app.post('/media/upload-url', { preHandler: app.requireUserOrElder }, async (req, reply) => {
    const input = uploadUrlSchema.parse(req.body);
    const caller = (req as never as { currentUser: UserTokenPayload | ElderTokenPayload }).currentUser;
    const data = await issueUploadUrl(caller, input);
    const body: ApiSuccess<MediaUploadUrlResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });

  // POST /media/confirm — user OR elder; caller must equal the original
  // uploader to avoid confirming someone else's pending row.
  app.post('/media/confirm', { preHandler: app.requireUserOrElder }, async (req, reply) => {
    const input = confirmSchema.parse(req.body);
    const caller = (req as never as { currentUser: UserTokenPayload | ElderTokenPayload }).currentUser;
    const data = await confirmUpload(caller, input);
    const body: ApiSuccess<MediaConfirmResponse> = { ok: true, data };
    return reply.status(200).send(body);
  });
}
