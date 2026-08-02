"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/lib/workspace-context"
import { formatBytes, cn } from "@/lib/utils"
import {
  useUpload,
  useLinkedFiles,
  useFileUrl,
  useDriveMutations,
  QuotaExceededError,
} from "@a2e/core"
import {
  Download,
  FileImage,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  UploadCloud,
} from "@/components/iconsax"

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

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB per file UI guard

function fileIcon(type: string) {
  if (type.startsWith("image/")) return FileImage
  return FileText
}

function FileDownloadLink({ fileId, name }: { fileId: string; name: string }) {
  const url = useFileUrl(fileId, "download")
  if (!url) {
    return (
      <span className="text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    )
  }
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" type="button" asChild>
      <a href={url} download={name} aria-label={name}>
        <Download className="h-3.5 w-3.5" />
      </a>
    </Button>
  )
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

  const files = useLinkedFiles(
    wsId ?? null,
    linkedTo.id ? { app: "bilan", type: linkedTo.type, id: linkedTo.id } : null,
  )
  const { upload, isUploading } = useUpload()
  const { removeFile } = useDriveMutations()

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!wsId) {
        toast.error("Select a workspace first")
        return
      }
      const arr = Array.from(files)
      if (!arr.length) return
      const current = files?.length ?? 0
      if (current + arr.length > max) {
        toast.error(t("tooMany", { max }))
        return
      }
      for (const file of arr) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(t("fileTooLarge", { name: file.name }))
          continue
        }
        try {
          const { fileId } = await upload({
            workspaceId: wsId,
            file,
            sourceApp: "bilan",
            linkedTo: linkedTo.id
              ? { app: "bilan", type: linkedTo.type, id: linkedTo.id }
              : undefined,
          })
          onUploaded?.(fileId)
        } catch (err) {
          console.error("Upload failed", err)
          if (err instanceof QuotaExceededError) {
            toast.error(`Quota exceeded (${err.domain}): ${err.used}/${err.limit}`)
          } else if (err instanceof Error) {
            toast.error(err.message || t("uploadFailed"))
          } else {
            toast.error(t("uploadFailed"))
          }
        }
      }
    },
    [wsId, files, max, t, upload, linkedTo, onUploaded],
  )

  const handleDelete = async (id: string) => {
    try {
      await removeFile({ fileId: id })
    } catch (err: any) {
      toast.error(err?.message || "Delete failed")
    }
  }

  const list = files ?? []

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
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloud className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="flex-1">
          <span className="font-medium">{isUploading ? t("uploading") : t("cta")}</span>
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
                <FileDownloadLink fileId={d._id} name={d.name} />
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
