import type {
  MediaConfirmResponse,
  MediaUploadUrlResponse,
  UserTokenPayload,
  ElderTokenPayload,
} from '@carelink/shared';
import { ErrorCodes } from '@carelink/shared';
import { ApiException } from '../../plugins/error-handler';
import { prisma } from '../../lib/prisma';
import { getPublicUrl, getUploadUrl, headKey, PRESIGN_TTL_SECONDS } from '../../lib/r2';
import type { ConfirmInput, UploadUrlInput } from './media.schema';

type Caller = UserTokenPayload | ElderTokenPayload;

// Key layout: {context}/{mediaId}/{filename}. The mediaId folder makes
// same-name uploads (e.g. photo.jpg) land in distinct paths so they
// don't overwrite each other.
function buildKey(mediaId: string, context: string, filename: string): string {
  return `${context}/${mediaId}/${filename}`;
}

// ── upload-url ────────────────────────────────────────────────────────────
export async function issueUploadUrl(
  caller: Caller,
  input: UploadUrlInput,
): Promise<MediaUploadUrlResponse> {
  // Insert the Media row first so we own the mediaId + key upfront.
  const uploaderUserId = caller.type === 'user' ? caller.sub : null;
  const uploaderElderId = caller.type === 'elder' ? caller.elderId : null;

  // Two-step insert: create with a placeholder key, then patch the key
  // using the row's id. Avoids a UUID generation race at the ORM layer.
  const draft = await prisma.media.create({
    data: {
      key: `__pending__/${Date.now()}-${Math.random()}`,
      contentType: input.contentType,
      context: input.context,
      uploaderUserId,
      uploaderElderId,
    },
  });

  const key = buildKey(draft.id, input.context, input.filename);
  await prisma.media.update({ where: { id: draft.id }, data: { key } });

  const uploadUrl = await getUploadUrl(key, input.contentType);

  return {
    uploadUrl,
    key,
    mediaId: draft.id,
    expiresIn: PRESIGN_TTL_SECONDS,
  };
}

// ── confirm ───────────────────────────────────────────────────────────────
export async function confirmUpload(
  caller: Caller,
  input: ConfirmInput,
): Promise<MediaConfirmResponse> {
  const media = await prisma.media.findUnique({ where: { id: input.mediaId } });
  if (!media) throw new ApiException(ErrorCodes.NOT_FOUND, 'Media not found');

  // Only the uploader can confirm their own upload. Prevents confirming
  // someone else's pending row.
  const callerId = caller.type === 'user' ? caller.sub : caller.elderId;
  const uploaderId = media.uploaderUserId ?? media.uploaderElderId;
  if (uploaderId !== callerId) {
    throw new ApiException(ErrorCodes.NOT_FOUND, 'Media not found');
  }

  const exists = await headKey(media.key);
  if (!exists) {
    throw new ApiException(ErrorCodes.NOT_FOUND, 'Upload not yet completed');
  }

  const now = new Date();
  const confirmed = await prisma.media.update({
    where: { id: media.id },
    data: { confirmedAt: now },
  });

  return {
    mediaId: confirmed.id,
    publicUrl: getPublicUrl(confirmed.key),
    confirmedAt: confirmed.confirmedAt!.toISOString(),
  };
}
