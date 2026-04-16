import { NextRequest, NextResponse } from "next/server"
import { uploadFileToS3, generateS3Key, type S3UploadResult } from "@/lib/s3"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"

// Maximum file size: 10MB (adjust as needed)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed file types for PDFs and images
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export async function POST(request: NextRequest) {
  try {
    // Check if S3 is configured
    if (!process.env.S3_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID) {
      return NextResponse.json(
        { error: "S3 not configured" },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const userId = formData.get("userId") as string || "anonymous"
    const documentTypeRaw = formData.get("documentType") as string || "other"

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, JPEG, PNG, GIF, WebP, DOC, DOCX" },
        { status: 400 }
      )
    }

    // Generate unique key for S3
    const key = generateS3Key(userId, documentTypeRaw, file.name)

    // Upload to S3
    const result: S3UploadResult = await uploadFileToS3(file, key, file.type)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Upload failed" },
        { status: 500 }
      )
    }

    // Save document metadata to database
    const documentType = (documentTypeRaw as 
      "invoice" | "receipt" | "certificate" | "contract" | "other")
    
    const document = await prisma.document.create({
      data: {
        name: file.name,
        type: documentType,
        size: file.size,
        url: result.url!,
        key: result.key!,
        userId: TEMP_USER_ID,
      },
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      size: file.size,
      name: file.name,
      type: file.type,
      documentId: document.id,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json(
        { error: "No key provided" },
        { status: 400 }
      )
    }

    const { deleteFileFromS3 } = await import("@/lib/s3")
    const success = await deleteFileFromS3(key)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
