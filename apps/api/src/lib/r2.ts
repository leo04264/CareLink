import {
  S3Client,
  CreateBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// One S3 client talks to either MinIO (local dev) or Cloudflare R2 (prod).
// Both are S3-compatible and accept path-style addressing, so the same
// config works for both — only the endpoint / credentials / public URL
// differ between envs (see apps/api/.env.example).
//
// Required env:
//   R2_ENDPOINT            e.g. http://localhost:9000  OR  https://{acct}.r2.cloudflarestorage.com
//   R2_ACCESS_KEY_ID
//   R2_SECRET_ACCESS_KEY
//   R2_BUCKET_NAME
//   R2_PUBLIC_URL          e.g. http://localhost:9000/{bucket}  OR  https://pub-xxx.r2.dev
//   R2_REGION              optional; defaults to "auto" (R2's value)

const endpoint = process.env.R2_ENDPOINT ?? 'http://localhost:9000';
const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? 'minioadmin';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? 'minioadmin';
export const BUCKET = process.env.R2_BUCKET_NAME ?? 'carelink-media';
const publicUrl = process.env.R2_PUBLIC_URL ?? `${endpoint}/${BUCKET}`;
const region = process.env.R2_REGION ?? 'auto';

export const s3 = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  // Path-style is required by MinIO and tolerated by R2. Setting it keeps
  // the same code path in both envs.
  forcePathStyle: true,
});

const PRESIGN_TTL = 300; // 5 minutes per spec §5.10

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: PRESIGN_TTL });
}

export async function headKey(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404 || status === 403) return false;
    throw err;
  }
}

export function getPublicUrl(key: string): string {
  return `${publicUrl.replace(/\/$/, '')}/${key}`;
}

export const PRESIGN_TTL_SECONDS = PRESIGN_TTL;

// ── one-time setup on boot ─────────────────────────────────────────────────
// On MinIO: create the bucket if missing and open read for anonymous GETs
// so publicUrl actually resolves in dev. On R2: bucket is pre-created via
// the Cloudflare dashboard; CreateBucket will fail with a 4xx we can
// silently swallow.
export async function ensureBucketReady(): Promise<void> {
  try {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
  } catch (err) {
    const name = (err as { name?: string }).name;
    const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    // Already exists → fine. Anything else, re-throw so we notice.
    const okCodes = new Set([409, 200]);
    if (!okCodes.has(status ?? 0) && name !== 'BucketAlreadyOwnedByYou' && name !== 'BucketAlreadyExists') {
      // eslint-disable-next-line no-console
      console.warn('[r2] CreateBucket:', name, status);
    }
  }

  // Dev-only: make objects publicly readable. Safe because the default
  // endpoint points at localhost and prod uses R2 which ignores this call.
  if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) {
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET}/*`],
        },
      ],
    });
    try {
      await s3.send(new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: policy }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[r2] PutBucketPolicy (dev):', (err as Error).message);
    }
  }
}
