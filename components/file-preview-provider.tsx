"use client"

import * as React from "react"
import { useAction } from "convex/react"
import { useTranslations } from "next-intl"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, FileText, Image as ImageIcon, Loader2 } from "@/components/iconsax"
import { formatBytes } from "@/lib/utils"

interface FilePreviewContext {
  preview: (doc: PreviewDoc) => void
  close: () => void
}

export type PreviewDoc = {
  _id: string
  name: string
  contentType?: string
  size: number
}

const Ctx = React.createContext<FilePreviewContext | null>(null)

export function FilePreviewProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("pages.preview")
  const [doc, setDoc] = React.useState<PreviewDoc | null>(null)
  const [open, setOpen] = React.useState(false)
  const [signed, setSigned] = React.useState<{ url: string; contentType?: string } | null>(null)
  const [loading, setLoading] = React.useState(false)
  const presignView = useAction(api.a2e_documents.presignView)
  const presignDownload = useAction(api.a2e_documents.presignDownload)

  const ctxValue = React.useMemo<FilePreviewContext>(
    () => ({
      preview: (d) => {
        setDoc(d)
        setOpen(true)
      },
      close: () => setOpen(false),
    }),
    [],
  )

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      if (!doc || !open) return
      setLoading(true)
      setSigned(null)
      try {
        const res = await presignView({ documentId: doc._id as Id<"a2e_documents"> })
        if (!cancelled && res) setSigned({ url: res.url, contentType: res.contentType })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [doc, open, presignView])

  const isImage = (doc?.contentType ?? signed?.contentType ?? "").startsWith("image/")
  const isPdf = (doc?.contentType ?? signed?.contentType ?? "") === "application/pdf"
  const isText = (doc?.contentType ?? signed?.contentType ?? "").startsWith("text/")
  const canPreview = isImage || isPdf || isText

  async function handleDownload() {
    if (!doc) return
    const res = await presignDownload({ documentId: doc._id as Id<"a2e_documents"> })
    if (res?.url) window.open(res.url, "_blank")
  }

  return (
    <Ctx.Provider value={ctxValue}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-3xl p-0 sm:max-w-3xl">
          <SheetHeader className="border-b border-border px-5 py-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              {isImage ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
              <span className="truncate">{doc?.name ?? t("title")}</span>
            </SheetTitle>
            {doc && (
              <p className="text-xs text-muted-foreground">
                {formatBytes(doc.size)}
                {doc.contentType ? ` · ${doc.contentType}` : ""}
              </p>
            )}
          </SheetHeader>
          <div className="flex h-[calc(100vh-64px-56px)] flex-col">
            <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/30">
              {loading ? (
                <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("loading")}
                </div>
              ) : !signed ? null : isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signed.url}
                  alt={doc?.name ?? ""}
                  className="max-h-full max-w-full object-contain"
                />
              ) : isPdf ? (
                <iframe src={signed.url} className="h-full w-full" title={doc?.name ?? "PDF"} />
              ) : isText ? (
                <iframe src={signed.url} className="h-full w-full bg-background" title={doc?.name ?? "Text"} />
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-sm text-muted-foreground">
                  <FileText className="h-10 w-10" />
                  <p>{t("noPreview")}</p>
                  <Button onClick={handleDownload} className="gap-2" variant="outline">
                    <Download className="h-3.5 w-3.5" /> {t("download")}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
              {signed && canPreview && (
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <a href={signed.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> {t("openOriginal")}
                  </a>
                </Button>
              )}
              <Button onClick={handleDownload} size="sm" variant="outline" className="gap-2">
                <Download className="h-3.5 w-3.5" /> {t("download")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Ctx.Provider>
  )
}

export function useFilePreview() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("useFilePreview must be used within FilePreviewProvider")
  return ctx
}
