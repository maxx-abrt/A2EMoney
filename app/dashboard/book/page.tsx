"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useWorkspace } from "@/lib/workspace-context"
import { formatDate } from "@/lib/utils"
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
import { Plus, BookOpen, Trash2, Loader2 } from "@/components/iconsax"
import { toast } from "sonner"

const TEMPLATES = [
  { id: "cashflow", icon: "💰", color: "#22c55e", columns: [
    { id: "date", name: "Date", type: "date" },
    { id: "description", name: "Description", type: "text" },
    { id: "category", name: "Category", type: "select", options: ["Income", "Expense"] },
    { id: "amount", name: "Amount", type: "currency" },
    { id: "notes", name: "Notes", type: "text" },
  ] },
  { id: "donations", icon: "💝", color: "#ec4899", columns: [
    { id: "date", name: "Date", type: "date" },
    { id: "donor", name: "Donor", type: "text" },
    { id: "amount", name: "Amount", type: "currency" },
    { id: "method", name: "Method", type: "select", options: ["Card", "Cash", "Bank transfer"] },
    { id: "receipt", name: "Receipt", type: "checkbox" },
  ] },
  { id: "grants", icon: "🎯", color: "#3b82f6", columns: [
    { id: "name", name: "Grant", type: "text" },
    { id: "funder", name: "Funder", type: "text" },
    { id: "amount", name: "Amount", type: "currency" },
    { id: "status", name: "Status", type: "select", options: ["Draft", "Submitted", "Approved", "Rejected"] },
    { id: "deadline", name: "Deadline", type: "date" },
  ] },
  { id: "custom", icon: "📄", color: "#a855f7", columns: [
    { id: "col1", name: "Column A", type: "text" },
    { id: "col2", name: "Column B", type: "text" },
  ] },
]

export default function BookPage() {
  const t = useTranslations("pages.book")
  const tCommon = useTranslations("common")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id

  const sheets = useQuery(api.a2e_books.listSheets, wsId ? { workspaceId: wsId } : "skip")
  const createSheet = useMutation(api.a2e_books.createSheet)
  const removeSheet = useMutation(api.a2e_books.removeSheet)

  const [open, setOpen] = React.useState(false)
  const [tpl, setTpl] = React.useState(TEMPLATES[0])
  const [name, setName] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!wsId) return
    try {
      setSaving(true)
      await createSheet({
        workspaceId: wsId,
        name: name.trim() || t(`templates.${tpl.id}`),
        icon: tpl.icon,
        color: tpl.color,
        columns: tpl.columns,
      })
      toast.success(t("toasts.created"))
      setOpen(false)
      setName("")
    } catch (err: any) { toast.error(err?.message || t("toasts.failed")) }
    finally { setSaving(false) }
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2 rounded-full shadow-sm"><Plus className="h-4 w-4" /> {t("new")}</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>{t("new")}</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <Label>{t("startFromTemplate")}</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TEMPLATES.map((tt) => (
                      <button key={tt.id} type="button" onClick={() => setTpl(tt)}
                        className={`rounded-lg border p-3 text-center transition ${tpl.id === tt.id ? "border-foreground bg-foreground/5" : "border-border hover:bg-muted"}`}>
                        <div className="text-xl">{tt.icon}</div>
                        <div className="mt-1 text-xs font-medium">{t(`templates.${tt.id}`)}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>{t("sheetName")}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t(`templates.${tpl.id}`)} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tCommon("cancel")}</Button>
                  <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tCommon("create")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {sheets === undefined ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : sheets.length === 0 ? (
          <GlassCard><EmptyState icon={BookOpen} title={t("empty.title")} description={t("empty.description")} action={{ onClick: () => setOpen(true), label: t("new") }} /></GlassCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sheets.map((s, idx) => (
              <motion.div key={s._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * idx }}>
                <Link href={`/dashboard/book/${s._id}`}>
                  <GlassCard className="group p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-lg" style={{ background: (s.color || "#22c55e") + "20" }}>{s.icon || "📒"}</div>
                        <div>
                          <h3 className="text-base font-semibold">{s.name}</h3>
                          <p className="text-xs text-muted-foreground">{t("columns", { count: (s.columns || []).length })}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => { e.preventDefault(); removeSheet({ sheetId: s._id }) }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{t("updated", { when: formatDate(s.updatedAt) })}</p>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
