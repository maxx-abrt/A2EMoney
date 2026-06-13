"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useWorkspace } from "@/lib/workspace-context"
import { formatDate } from "@/lib/utils"
import { FICHE_TEMPLATES } from "@/lib/fiche-templates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/empty-state"
import { GlassCard } from "@/components/glass-card"
import {
  ClipboardList,
  FilePlus2,
  Loader2,
  Plus,
  Copy,
  Trash2,
  FileText,
  Sparkles,
} from "@/components/iconsax"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function FichesPage() {
  const t = useTranslations("pages.fiches")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const locale = useLocale()
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const fiches = useQuery(api.a2e_fiches.list, wsId ? { workspaceId: wsId } : "skip")
  const projects = useQuery(api.projects.list, wsId ? { workspaceId: wsId } : "skip")
  const create = useMutation(api.a2e_fiches.create)
  const duplicate = useMutation(api.a2e_fiches.duplicate)
  const remove = useMutation(api.a2e_fiches.remove)

  const [open, setOpen] = React.useState(false)
  const [templateId, setTemplateId] = React.useState<"asso_fr" | "blank">("asso_fr")
  const [title, setTitle] = React.useState("")
  const [projectId, setProjectId] = React.useState<string>("")
  const [query, setQuery] = React.useState("")
  const [creating, setCreating] = React.useState(false)

  const filtered = React.useMemo(
    () =>
      (fiches ?? []).filter((f) =>
        f.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [fiches, query],
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!wsId) return
    try {
      setCreating(true)
      const tpl = FICHE_TEMPLATES[templateId]
      const id = await create({
        workspaceId: wsId,
        template: templateId,
        title: title.trim() || t(`templates.${tpl.i18nKey}.name`),
        data: tpl.defaultData,
        projectId: projectId ? (projectId as Id<"projects">) : undefined,
        locale,
      })
      toast.success(t("saved"))
      router.push(`/dashboard/fiches/${id}`)
    } catch (err: any) {
      toast.error(err?.message || tCommon("errorOccurred"))
    } finally {
      setCreating(false)
      setOpen(false)
      setTitle("")
    }
  }

  return (
    <div className="relative px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-96 -translate-x-1/2 rounded-full bg-fuchsia-400/15 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Sparkles className="h-5 w-5 text-accent" />
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Input
              placeholder={t("search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 sm:w-72"
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-full shadow-sm">
                  <Plus className="h-4 w-4" /> {t("new")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{t("new")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label>{t("templateLabel")}</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(["asso_fr", "blank"] as const).map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setTemplateId(id)}
                          className={cn(
                            "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition",
                            templateId === id
                              ? "border-foreground bg-foreground/5"
                              : "border-border hover:bg-muted",
                          )}
                        >
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">{t(`templates.${id}.name`)}</span>
                          <span className="text-xs text-muted-foreground">{t(`templates.${id}.description`)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>{t("fields.ficheTitle")}</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t(`templates.${templateId}.name`)} />
                  </div>
                  {(projects ?? []).length > 0 && (
                    <div>
                      <Label>{t("linkedProject")}</Label>
                      <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      >
                        <option value="">{t("noProjectLinked")}</option>
                        {(projects ?? []).map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      {tCommon("cancel")}
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : tCommon("create")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {fiches === undefined ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={ClipboardList}
              title={t("empty.title")}
              description={t("empty.description")}
              action={{ onClick: () => setOpen(true), label: t("new") }}
            />
          </GlassCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((f, idx) => (
              <motion.div
                key={f._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * idx }}
              >
                <GlassCard className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/dashboard/fiches/${f._id}`} className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold hover:underline">{f.title}</h3>
                      <p className="text-xs text-muted-foreground">{t(`templates.${f.template === "asso_fr" ? "asso_fr" : "blank"}.name`)}</p>
                    </Link>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={async () => {
                          await duplicate({ ficheId: f._id })
                          toast.success(t("duplicate"))
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => remove({ ficheId: f._id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{t("lastSaved", { when: formatDate(f.updatedAt) })}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
