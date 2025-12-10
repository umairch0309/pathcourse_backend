import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// ----------------------
// S3 Config
// ----------------------
const bucketName = Bun.env.S3_BUCKET_NAME
const region = Bun.env.S3_BUCKET_REGION
const accessKeyId = Bun.env.S3_ACCESS_KEY
const secretAccessKey = Bun.env.S3_SECRET_KEY
const awsBucketUrl = Bun.env.AWS_BUCKET_URL

if (!bucketName || !region || !accessKeyId || !secretAccessKey || !awsBucketUrl) {
  throw new Error('Missing required S3 environment variables')
}

const S3_CONFIG = {
  bucketName,
  region,
  accessKeyId,
  secretAccessKey,
  awsBucketUrl,
}

// ----------------------
// Client
// ----------------------
export const s3Client = new S3Client({
  region: S3_CONFIG.region,
  credentials: {
    accessKeyId: S3_CONFIG.accessKeyId,
    secretAccessKey: S3_CONFIG.secretAccessKey,
  },
})

// ----------------------
// Utils
// ----------------------

/**
 * Uploads a file to S3.
 */
export const uploadFileToS3 = async (file: File, directory?: string): Promise<string> => {
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const extension = file.type.split('/')[1] || 'bin'
  const uniqueKey = `${sanitizedFileName}-${Date.now()}.${extension}`
  const key = directory ? `${directory}/${uniqueKey}` : uniqueKey

  const buffer = Buffer.from(await file.arrayBuffer())

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_CONFIG.bucketName,
      Key: key,
      Body: buffer,
    })
  )

  return `${S3_CONFIG.awsBucketUrl}/${key}`
}

/**
 * Deletes one or multiple objects from S3.
 */
export const deleteObjectsFromS3 = async (keys: string | string[]): Promise<void> => {
  const keysArray = Array.isArray(keys) ? keys : [keys]

  await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: S3_CONFIG.bucketName,
      Delete: {
        Objects: keysArray.map(key => ({ Key: key })),
        Quiet: false,
      },
    })
  )
}

/**
 * Generates a signed URL for uploading a file.
 */
export const generateUploadUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.bucketName,
    Key: key,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Generates a signed URL for downloading a file.
 */
export const generateDownloadUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: S3_CONFIG.bucketName,
    Key: key,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Generates a presigned URL for uploading a file.
 * File will be publicly accessible if bucket has public read policy for this path.
 * This allows direct upload from frontend to S3.
 */
export const generatePublicUploadUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.bucketName,
    Key: key,
    // Don't set ACL - modern S3 buckets have ACLs disabled
    // Make sure your bucket policy allows public read for assets/* path
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Gets the public URL for an asset (no signed URL needed).
 */
export const getPublicAssetUrl = (key: string): string => {
  return `${S3_CONFIG.awsBucketUrl}/${key}`
}

/**
 * Converts S3 key(s) to signed URL(s) for downloading.
 * Accepts either a single key or an array of keys.
 * Returns signed URLs with the specified expiry time (default: 7 days).
 */
export const keysToSignedUrls = async (
  keys: string | string[],
  expiresIn = 7 * 24 * 3600 // 7 days default
): Promise<string | string[]> => {
  // Handle single key
  if (typeof keys === 'string') {
    return generateDownloadUrl(keys, expiresIn)
  }

  // Handle array of keys
  return Promise.all(keys.map(key => generateDownloadUrl(key, expiresIn)))
}
