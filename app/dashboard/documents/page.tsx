"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  useFiles,
  useQuota,
  useDriveMutations,
  useCoreAction,
  coreApi,
  QuotaExceededError,
} from "@a2e/core"
import { useWorkspace } from "@/lib/workspace-context"
import { useFilePreview } from "@/components/file-preview-provider"
import { formatBytes, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { GlassCard } from "@/components/glass-card"
import { AttachmentsField } from "@/components/attachments-field"
import { FileText, HardDrive, Trash2, Loader2, Download, Image as ImageIcon, Eye } from "@/components/iconsax"
import { toast } from "sonner"

export default function DocumentsPage() {
  const t = useTranslations("pages.documents")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  // Files + quotas come from the A2E Core drive — shared with every suite app.
  const docs = useFiles(wsId as any)
  const storage = useQuota(wsId as any, "storageBytes")
  const fileCount = useQuota(wsId as any, "maxDriveFiles")
  const { removeFile } = useDriveMutations()
  const presignDownload = useCoreAction(coreApi.drive.presignDownload)
  const { preview } = useFilePreview()

  async function handleDownload(id: string) {
    try {
      const res = await presignDownload({ fileId: id as any })
      if (res?.url) window.open(res.url, "_blank")
    } catch (err: any) {
      toast.error(err?.message || "Download failed")
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeFile({ fileId: id as any })
    } catch (err: any) {
      toast.error(
        err instanceof QuotaExceededError
          ? `Quota exceeded (${err.domain})`
          : err?.message || "Delete failed",
      )
    }
  }

  const usedPct = storage?.percent ?? 0

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>

        {storage && storage.used != null && (
          <GlassCard className="p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t("storage.used")}</span>
              <span className="text-muted-foreground">
                {formatBytes(storage.used ?? 0)} / {storage.limit === -1 ? "∞" : formatBytes(storage.limit)}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, usedPct)}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full bg-[var(--brand-green)]" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("storage.files", { count: fileCount?.used ?? 0 })} · {Math.round(usedPct)}%
            </p>
          </GlassCard>
        )}

        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold">{t("uploadTitle")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("uploadDescription")}</p>
          <div className="mt-3">
            <AttachmentsField linkedTo={{ type: "project", id: undefined }} documentType="other" max={50} />
          </div>
        </GlassCard>

        <GlassCard>
          {docs === undefined ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : docs.length === 0 ? (
            <EmptyState icon={HardDrive} title={t("empty.title")} description={t("empty.description")} />
          ) : (
            <ul className="divide-y divide-border/60">
              {docs.map((d, idx) => {
                const isImage = d.contentType?.startsWith("image/")
                const Icon = isImage ? ImageIcon : FileText
                return (
                  <motion.li
                    key={d._id}
                    initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.015 * idx }}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
                  >
                    <button
                      type="button"
                      onClick={() => preview({ _id: d._id, name: d.name, contentType: d.contentType, size: d.size })}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(d.size)} · {formatDate(d.createdAt)} · {d.sourceApp}</p>
                      </div>
                    </button>
                    {d.linkedTo?.type && <Badge variant="secondary" className="shrink-0">{d.linkedTo.type}</Badge>}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => preview({ _id: d._id, name: d.name, contentType: d.contentType, size: d.size })}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(d._id)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemove(d._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </motion.li>
                )
              })}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
