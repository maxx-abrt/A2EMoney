"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useDataStore, formatBytes } from "@/lib/data-store"
import {
  Download,
  FileImage,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface LocalAttachment {
  id: string
  name: string
  size: number
  type: string
  url?: string
  key?: string
}

interface AttachmentsFieldProps {
  value: LocalAttachment[]
  onChange: (next: LocalAttachment[]) => void
  linkedTo?: { type: "expense" | "invoice" | "book_entry"; id?: string }
  documentType?: "receipt" | "invoice" | "certificate" | "contract" | "other"
  max?: number
  className?: string
  compact?: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file

function fileIcon(type: string) {
  if (type.startsWith("image/")) return FileImage
  return FileText
}

export function AttachmentsField({
  value,
  onChange,
  linkedTo,
  documentType = "receipt",
  max = 5,
  className,
  compact = false,
}: AttachmentsFieldProps) {
  const t = useTranslations("attachments")
  const { addDocument } = useDataStore()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files)
      if (!arr.length) return
      if (value.length + arr.length > max) {
        toast.error(t("tooMany", { max }))
        return
      }
      setUploading(true)
      const added: LocalAttachment[] = []
      for (const file of arr) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(t("fileTooLarge", { name: file.name }))
          continue
        }
        try {
          const fd = new FormData()
          fd.append("file", file)
          fd.append("documentType", documentType)
          if (linkedTo?.type) fd.append("linkedToType", linkedTo.type)
          if (linkedTo?.id) fd.append("linkedToId", linkedTo.id)

          const res = await fetch("/api/upload", { method: "POST", body: fd })
          const data = await res.json()
          if (!res.ok) {
            // Fall back to local (browser) storage if S3 unavailable
            if (res.status === 413) {
              toast.error(data?.message ?? t("quotaExceeded"))
              continue
            }
            throw new Error(data?.error ?? "Upload failed")
          }
          const att: LocalAttachment = {
            id: data.documentId ?? crypto.randomUUID(),
            name: data.name,
            size: data.size,
            type: data.type ?? file.type,
            url: data.url,
            key: data.key,
          }
          added.push(att)
        } catch (err) {
          // Local fallback — shove into DataStore so the row has something to show
          try {
            const id = await addDocument({
              name: file.name,
              type: documentType,
              size: file.size,
              linkedTo: linkedTo?.type && linkedTo.id
                ? { type: linkedTo.type, id: linkedTo.id }
                : undefined,
            })
            added.push({
              id,
              name: file.name,
              size: file.size,
              type: file.type,
            })
            toast.message(t("fallbackLocal", { name: file.name }))
          } catch {
            toast.error(
              err instanceof Error ? err.message : t("uploadFailed"),
            )
          }
        }
      }
      if (added.length) onChange([...value, ...added])
      setUploading(false)
    },
    [value, onChange, max, documentType, linkedTo, addDocument, t],
  )

  const removeAttachment = async (att: LocalAttachment) => {
    if (att.key) {
      try {
        await fetch(`/api/upload?key=${encodeURIComponent(att.key)}`, {
          method: "DELETE",
        })
      } catch {}
    }
    onChange(value.filter(a => a.id !== att.id))
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="application/pdf,image/*,.doc,.docx"
        className="hidden"
        onChange={e => {
          if (e.target.files) void handleFiles(e.target.files)
          if (inputRef.current) inputRef.current.value = ""
        }}
      />

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-4 py-5 text-center transition-colors",
          dragOver && "border-accent bg-accent/5",
          compact && "py-3",
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {uploading ? t("uploading") : t("cta")}
          </p>
          <p className="text-xs text-muted-foreground">{t("hint")}</p>
        </div>
      </div>

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map(att => {
            const Icon = fileIcon(att.type)
            return (
              <li
                key={att.id}
                className="group flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{att.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(att.size)}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                  {att.url && (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      title={t("download")}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => void removeAttachment(att)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title={t("remove")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function AttachmentsBadge({ count }: { count: number }) {
  const t = useTranslations("attachments")
  if (!count) return null
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
      title={t("countLabel", { count })}
    >
      <Paperclip className="h-3 w-3" />
      {count}
    </span>
  )
}
