"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
<<<<<<< HEAD
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
=======
import {
  QuotaExceededError,
  coreApi,
  useCoreAction,
  useDriveMutations,
  useLinkedFiles,
  useUpload,
  useWorkspace,
} from "@a2e/core"
import { Button } from "@/components/ui/button"
import { useFilePreview } from "@/components/file-preview-provider"
import { formatBytes, cn } from "@/lib/utils"
import { Download, FileImage, FileText, Loader2, Trash2, UploadCloud } from "@/components/iconsax"
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454

/**
 * Attachments on any Bilan record — backed by the **A2E Core drive** (Backblaze
 * B2, private bucket, presigned URLs only).
 *
 * Files are stamped `sourceApp: "bilan"` and linked with
 * `linkedTo: { app: "bilan", type, id }`, which is exactly how the Drive app (and
 * any other suite app) finds "the receipts of this expense" — live, no copies.
 */
interface AttachmentsFieldProps {
  linkedTo: {
    type: "expense" | "invoice" | "book_entry" | "project" | "fiche" | "grant_report"
    id?: string
  }
  /** Kept for API compatibility with the pre-core component (unused server-side). */
  documentType?: "receipt" | "invoice" | "certificate" | "contract" | "other"
  max?: number
  className?: string
  compact?: boolean
  onUploaded?: (fileId: string) => void
}

<<<<<<< HEAD
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB per file UI guard
=======
const MAX_FILE_SIZE = 25 * 1024 * 1024
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454

function fileIcon(type: string) {
  return type.startsWith("image/") ? FileImage : FileText
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
  max = 10,
  className,
  compact = false,
  onUploaded,
}: AttachmentsFieldProps) {
  const t = useTranslations("attachments")
  const { activeWorkspaceId } = useWorkspace()
  const target = linkedTo.id ? { app: "bilan", type: linkedTo.type, id: linkedTo.id } : null
  const files = useLinkedFiles(activeWorkspaceId, target)
  const { preview } = useFilePreview()

<<<<<<< HEAD
  const files = useLinkedFiles(
    wsId ?? null,
    linkedTo.id ? { app: "bilan", type: linkedTo.type, id: linkedTo.id } : null,
  )
  const { upload, isUploading } = useUpload()
  const { removeFile } = useDriveMutations()
=======
  const [pct, setPct] = useState(0)
  const { upload, isUploading } = useUpload({ onProgress: setPct })
  const { removeFile } = useDriveMutations()
  const presignDownload = useCoreAction(coreApi.drive.presignDownload)
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const list = files ?? []

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      if (!activeWorkspaceId) {
        toast.error("Select a workspace first")
        return
      }
      const arr = Array.from(incoming)
      if (!arr.length) return
<<<<<<< HEAD
      const current = files?.length ?? 0
      if (current + arr.length > max) {
=======
      if (list.length + arr.length > max) {
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454
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
<<<<<<< HEAD
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
=======
            workspaceId: activeWorkspaceId,
            file,
            sourceApp: "bilan",
            linkedTo: target ?? undefined,
          })
          onUploaded?.(fileId)
        } catch (error: any) {
          if (error instanceof QuotaExceededError) {
            toast.error(t("quotaExceeded"), {
              description: `${error.domain} — ${error.used ?? "?"} / ${error.limit ?? "?"}`,
            })
          } else {
            toast.error(error?.message || t("uploadFailed"))
          }
        }
      }
      setPct(0)
    },
    [activeWorkspaceId, list.length, max, onUploaded, t, target, upload],
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454
  )

  async function handleDownload(fileId: string) {
    try {
<<<<<<< HEAD
      await removeFile({ fileId: id })
    } catch (err: any) {
      toast.error(err?.message || "Delete failed")
    }
  }

  const list = files ?? []

=======
      const { url } = await presignDownload({ fileId })
      window.open(url, "_blank")
    } catch (error: any) {
      toast.error(error?.message || "Download failed")
    }
  }

>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454
  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        data-testid="attachments-dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files)
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
<<<<<<< HEAD
          <span className="font-medium">{isUploading ? t("uploading") : t("cta")}</span>
=======
          <span className="font-medium">{isUploading ? `${t("uploading")} ${pct}%` : t("cta")}</span>
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454
          <span className="ml-2 text-xs text-muted-foreground">{t("hint")}</span>
        </span>
        {list.length > 0 && (
          <span className="text-xs text-muted-foreground">{t("countLabel", { count: list.length })}</span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        data-testid="attachments-input"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files)
          e.target.value = ""
        }}
      />
      {isUploading && (
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {list.length > 0 && (
        <ul className="space-y-1">
          {list.map((file) => {
            const Icon = fileIcon(file.contentType || "")
            return (
              <li
                key={file._id}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
<<<<<<< HEAD
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatBytes(d.size)}
                </span>
                <FileDownloadLink fileId={d._id} name={d.name} />
=======
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left hover:underline"
                  onClick={() =>
                    preview({
                      _id: file._id,
                      name: file.name,
                      contentType: file.contentType,
                      size: file.size,
                    })
                  }
                >
                  {file.name}
                </button>
                <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  type="button"
                  onClick={() => handleDownload(file._id)}
                  aria-label={t("download")}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  type="button"
                  onClick={() => removeFile({ fileId: file._id })}
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
