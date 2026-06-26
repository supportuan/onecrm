import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let client: S3Client | null = null;

export function isS3Configured(): boolean {
  return Boolean(
    process.env.AWS_S3_BUCKET &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY,
  );
}

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export function getBucket(): string {
  return process.env.AWS_S3_BUCKET!;
}

export function getS3Prefix(): string {
  return (process.env.AWS_S3_PREFIX || 'onecrm').replace(/^\/+|\/+$/g, '');
}

export function buildS3Key(relativePath: string): string {
  const prefix = getS3Prefix();
  const clean = relativePath.replace(/^\/+/, '').replace(/^uploads\//, 'uploads/');
  return `${prefix}/${clean}`;
}

export function toS3Ref(key: string): string {
  return `s3:${key}`;
}

export function parseS3Ref(ref: string): string | null {
  if (!ref.startsWith('s3:')) return null;
  return ref.slice(3);
}

export function signedUrlExpiresSeconds(): number {
  const raw = Number(process.env.AWS_S3_SIGNED_URL_EXPIRES_SECONDS || 3600);
  return Number.isFinite(raw) && raw > 0 ? raw : 3600;
}

export async function putObject(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string,
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
    }),
  );
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const res = await getClient().send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key }),
  );
  const bytes = await res.Body?.transformToByteArray();
  if (!bytes) throw new Error(`Empty S3 object: ${key}`);
  return Buffer.from(bytes);
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await getClient().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

export async function getPresignedGetUrl(key: string, expiresIn?: number): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(getClient(), command, {
    expiresIn: expiresIn ?? signedUrlExpiresSeconds(),
  });
}
