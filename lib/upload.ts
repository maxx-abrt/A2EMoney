"use client"

import { useState } from "react"

export interface UploadProgress {
  status: "idle" | "uploading" | "success" | "error"
  progress: number
  error?: string
  url?: string
}

/**
 * Hook for uploading files to S3 via API
 */
export function useS3Upload() {
  const [uploadState, setUploadState] = useState<UploadProgress>({
    status: "idle",
    progress: 0,
  })

  const uploadFile = async (
    file: File,
    userId: string,
    documentType: "invoice" | "receipt" | "certificate" | "contract" | "other" = "other"
  ): Promise<{ success: boolean; url?: string; size?: number }> => {
    try {
      setUploadState({ status: "uploading", progress: 0 })

      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", userId)
      formData.append("documentType", documentType)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()

      setUploadState({
        status: "success",
        progress: 100,
        url: data.url,
      })

      return {
        success: true,
        url: data.url,
        size: data.size,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed"
      setUploadState({
        status: "error",
        progress: 0,
        error: errorMessage,
      })
      return { success: false }
    }
  }

  const deleteFile = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/upload?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Delete failed")
      }

      return true
    } catch (error) {
      console.error("Delete error:", error)
      return false
    }
  }

  const reset = () => {
    setUploadState({ status: "idle", progress: 0 })
  }

  return {
    uploadFile,
    deleteFile,
    reset,
    ...uploadState,
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes } = options

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${formatFileSize(maxSize)}`,
    }
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    }
  }

  return { valid: true }
}
