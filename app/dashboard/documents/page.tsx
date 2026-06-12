"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useAction, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useWorkspace } from "@/lib/workspace-context"
import { formatBytes, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { AttachmentsField } from "@/components/attachments-field"
import { FileText, HardDrive, Trash2, Loader2, Download, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

export default function DocumentsPage() {
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const docs = useQuery(api.a2e_documents.list, wsId ? { workspaceId: wsId } : "skip")
  const storage = useQuery(api.workspaces.getStorage, wsId ? { workspaceId: wsId } : "skip")
  const presignDownload = useAction(api.a2e_documents.presignDownload)
  const removeDoc = useAction(api.a2e_documents.remove)

  async function handleDownload(id: Id<"a2e_documents">) {
    try {
      const res = await presignDownload({ documentId: id })
      if (res?.url) window.open(res.url, "_blank")
    } catch (err: any) {
      toast.error(err?.message || "Download failed")
    }
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Receipts, contracts, certificates — stored securely on AWS S3 (Paris).</p>
        </div>

        {storage && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Storage used</span>
              <span className="text-muted-foreground">{formatBytes(storage.used)} / {formatBytes(storage.total)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, storage.percentage)}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{storage.count} documents · {Math.round(storage.percentage)}% used</p>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Upload new document</h2>
          <p className="mt-1 text-xs text-muted-foreground">Files uploaded here are not linked to any entity. You can link them from an invoice, expense, project or book entry.</p>
          <div className="mt-3">
            <AttachmentsField linkedTo={{ type: "project", id: undefined }} documentType="other" max={50} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card">
          {docs === undefined ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : docs.length === 0 ? (
            <EmptyState icon={HardDrive} title="No documents yet" description="Upload receipts, certificates and supporting files." />
          ) : (
            <ul className="divide-y divide-border">
              {docs.map((d) => {
                const isImage = d.contentType?.startsWith("image/")
                const Icon = isImage ? ImageIcon : FileText
                return (
                  <li key={d._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(d.size)} · {formatDate(d.createdAt)} · {d.type}
                      </p>
                    </div>
                    {d.linkedToType && (
                      <Badge variant="secondary" className="shrink-0">{d.linkedToType}</Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(d._id)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeDoc({ documentId: d._id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
