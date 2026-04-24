import { z } from 'zod';

// Adding a new context is a one-line change here — service layer uses it
// as the key-path prefix verbatim with no branching.
const contextEnum = z.enum(['medication-log', 'elder-avatar']);

// Restrict to image MIME types. Broader types (audio/video) can be added
// later without touching route code; the service just stores contentType
// as-is and forwards it to the S3 presigner.
const contentTypeEnum = z.enum(['image/jpeg', 'image/png', 'image/webp']);

// Sanitize filename: strip directory separators + length cap. The key the
// server builds is `${context}/${mediaId}/${sanitized}` so we don't want
// a rogue `../` sneaking across contexts.
const filenameSchema = z
  .string()
  .min(1)
  .max(180)
  .regex(/^[^/\\\x00-\x1f]+$/, 'filename may not contain path separators or control chars');

export const uploadUrlSchema = z.object({
  filename: filenameSchema,
  contentType: contentTypeEnum,
  context: contextEnum,
});

export const confirmSchema = z.object({
  mediaId: z.string().uuid(),
});

export type UploadUrlInput = z.infer<typeof uploadUrlSchema>;
export type ConfirmInput = z.infer<typeof confirmSchema>;
