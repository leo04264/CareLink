import type { ISODate } from './family';

// Allowlist of upload contexts. Kept small on purpose — adding a new
// context is a one-line change in both this enum and the service-side
// Zod schema. See spec §5.10.
export const MediaContext = {
  MEDICATION_LOG: 'medication-log',
  ELDER_AVATAR: 'elder-avatar',
} as const;
export type MediaContext = (typeof MediaContext)[keyof typeof MediaContext];

export type MediaContentType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface MediaUploadUrlRequest {
  filename: string;
  contentType: MediaContentType;
  context: MediaContext;
}

export interface MediaUploadUrlResponse {
  uploadUrl: string;  // presigned PUT, 5-minute TTL
  key: string;        // S3 key the client must PUT to
  mediaId: string;    // pass this to /media/confirm after upload
  expiresIn: number;  // seconds
}

export interface MediaConfirmRequest {
  mediaId: string;
}

export interface MediaConfirmResponse {
  mediaId: string;
  publicUrl: string;
  confirmedAt: ISODate;
}
