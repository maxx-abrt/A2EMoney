import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  // Optional: for MinIO or other S3-compatible services
  ...(process.env.S3_ENDPOINT && {
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  }),
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || ""

export interface S3UploadResult {
  success: boolean
  url?: string
  key?: string
  error?: string
}

/**
 * Upload a file to S3
 */
export async function uploadFileToS3(
  file: Buffer | Blob | File,
  key: string,
  contentType: string
): Promise<S3UploadResult> {
  try {
    // Convert File/Blob to Buffer for server-side upload
    let buffer: Buffer
    if (file instanceof File || file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      buffer = file
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Optional: Add metadata
      Metadata: {
        uploadedAt: new Date().toISOString(),
        source: "finflow-app",
      },
    })

    await s3Client.send(command)

    // Construct the public URL
    const url = process.env.S3_ENDPOINT
      ? `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`
      : `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

    return {
      success: true,
      url,
      key,
    }
  } catch (error) {
    console.error("S3 upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFileFromS3(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
    return true
  } catch (error) {
    console.error("S3 delete error:", error)
    return false
  }
}

/**
 * Generate a pre-signed URL for temporary access
 */
export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn })
    return url
  } catch (error) {
    console.error("S3 signed URL error:", error)
    return null
  }
}

/**
 * Extract S3 key from full URL
 */
export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // Format: https://bucket.s3.region.amazonaws.com/key
    // or: https://s3.endpoint.com/bucket/key
    const pathParts = urlObj.pathname.split("/").filter(Boolean)
    
    if (process.env.S3_ENDPOINT) {
      // Path-style URL: /bucket/key
      return pathParts.slice(1).join("/")
    } else {
      // Virtual-hosted-style: /key
      return pathParts.join("/")
    }
  } catch {
    return null
  }
}

/**
 * Generate unique file key for S3
 */
export function generateS3Key(
  userId: string,
  documentType: string,
  originalName: string
): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase()
  
  return `users/${userId}/${documentType}/${timestamp}-${random}-${sanitizedName}`
}
