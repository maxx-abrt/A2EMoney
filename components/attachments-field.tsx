"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useAction, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/lib/workspace-context"
import { formatBytes, cn } from "@/lib/utils"
import {
  Download,
  FileImage,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  UploadCloud,
} from "lucide-react"

interface AttachmentsFieldProps {
  linkedTo: {
    type: "expense" | "invoice" | "book_entry" | "project"
    id?: string
  }
  documentType?: "receipt" | "invoice" | "certificate" | "contract" | "other"
  max?: number
  className?: string
  compact?: boolean
  onUploaded?: (documentId: string) => void
}

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB per file

function fileIcon(type: string) {
  if (type.startsWith("image/")) return FileImage
  return FileText
}

export function AttachmentsField({
  linkedTo,
  documentType = "receipt",
  max = 10,
  className,
  compact = false,
  onUploaded,
}: AttachmentsFieldProps) {
  const t = useTranslations("attachments")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id

  const docs = useQuery(
    api.a2e_documents.list,
    wsId && linkedTo.id
      ? {
          workspaceId: wsId,
          linkedToType: linkedTo.type,
          linkedToId: linkedTo.id,
        }
      : "skip",
  )

  const presignUpload = useAction(api.a2e_documents.presignUpload)
  const createDoc = useMutation(api.a2e_documents.create)
  const removeDoc = useAction(api.a2e_documents.remove)
  const presignDownload = useAction(api.a2e_documents.presignDownload)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!wsId) {
        toast.error("Select a workspace first")
        return
      }
      const arr = Array.from(files)
      if (!arr.length) return
      const current = docs?.length ?? 0
      if (current + arr.length > max) {
        toast.error(t("tooMany", { max }))
        return
      }
      setUploading(true)
      for (const file of arr) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(t("fileTooLarge", { name: file.name }))
          continue
        }
        try {
          // 1. presign
          const { uploadUrl, key, publicUrl } = await presignUpload({
            workspaceId: wsId,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
          })
          // 2. PUT to S3
          const res = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          })
          if (!res.ok) throw new Error(`S3 upload failed (${res.status})`)
          // 3. record
          const docId = await createDoc({
            workspaceId: wsId,
            name: file.name,
            type: documentType,
            size: file.size,
            contentType: file.type || "application/octet-stream",
            url: publicUrl,
            s3Key: key,
            linkedToType: linkedTo.type,
            linkedToId: linkedTo.id,
          })
          onUploaded?.(docId)
        } catch (err: any) {
          console.error("Upload failed", err)
          toast.error(err?.message || t("uploadFailed"))
        }
      }
      setUploading(false)
    },
    [wsId, docs, max, t, presignUpload, createDoc, documentType, linkedTo, onUploaded],
  )

  const handleDelete = async (id: string) => {
    try {
      await removeDoc({ documentId: id as Id<"a2e_documents"> })
    } catch (err: any) {
      toast.error(err?.message || "Delete failed")
    }
  }

  const handleDownload = async (id: string) => {
    try {
      const res = await presignDownload({ documentId: id as Id<"a2e_documents"> })
      if (res?.url) window.open(res.url, "_blank")
    } catch (err: any) {
      toast.error(err?.message || "Download failed")
    }
  }

  const list = docs ?? []

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-3 text-left text-sm transition-colors",
          dragOver ? "border-foreground bg-muted/60" : "border-border hover:bg-muted/50",
          compact && "py-2",
        )}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloud className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="flex-1">
          <span className="font-medium">{uploading ? t("uploading") : t("cta")}</span>
          <span className="ml-2 text-xs text-muted-foreground">{t("hint")}</span>
        </span>
        {list.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {t("countLabel", { count: list.length })}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.target.value = ""
        }}
      />
      {list.length > 0 && (
        <ul className="space-y-1">
          {list.map((d) => {
            const Icon = fileIcon(d.contentType || "")
            return (
              <li
                key={d._id}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatBytes(d.size)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  type="button"
                  onClick={() => handleDownload(d._id)}
                  aria-label={t("download")}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  type="button"
                  onClick={() => handleDelete(d._id)}
                  aria-label={t("remove")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
