"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
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
import { Plus, BookOpen, Trash2, Loader2, Sheet, Download, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

const TEMPLATES = [
  {
    id: "cashflow",
    name: "Cash flow",
    icon: "💰",
    color: "#22c55e",
    columns: [
      { id: "date", name: "Date", type: "date" },
      { id: "description", name: "Description", type: "text" },
      { id: "category", name: "Category", type: "select", options: ["Income", "Expense"] },
      { id: "amount", name: "Amount", type: "currency" },
      { id: "notes", name: "Notes", type: "text" },
    ],
  },
  {
    id: "donations",
    name: "Donations log",
    icon: "💝",
    color: "#ec4899",
    columns: [
      { id: "date", name: "Date", type: "date" },
      { id: "donor", name: "Donor", type: "text" },
      { id: "amount", name: "Amount", type: "currency" },
      { id: "method", name: "Method", type: "select", options: ["Card", "Cash", "Bank transfer"] },
      { id: "receipt", name: "Receipt sent", type: "checkbox" },
    ],
  },
  {
    id: "grants",
    name: "Grants tracker",
    icon: "🎯",
    color: "#3b82f6",
    columns: [
      { id: "name", name: "Grant", type: "text" },
      { id: "funder", name: "Funder", type: "text" },
      { id: "amount", name: "Amount", type: "currency" },
      { id: "status", name: "Status", type: "select", options: ["Draft", "Submitted", "Approved", "Rejected"] },
      { id: "deadline", name: "Deadline", type: "date" },
    ],
  },
  {
    id: "custom",
    name: "Blank sheet",
    icon: "📄",
    color: "#a855f7",
    columns: [
      { id: "col1", name: "Column A", type: "text" },
      { id: "col2", name: "Column B", type: "text" },
    ],
  },
]

export default function BookPage() {
  const t = useTranslations("common")
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
        name: name.trim() || tpl.name,
        icon: tpl.icon,
        color: tpl.color,
        columns: tpl.columns,
      })
      toast.success("Sheet created")
      setOpen(false)
      setName("")
    } catch (err: any) {
      toast.error(err?.message || "Could not create sheet")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Books</h1>
            <p className="mt-1 text-sm text-muted-foreground">Custom spreadsheets for any financial data. Export to CSV / Google Sheets compatible.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> New sheet</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Create a sheet</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label>Start from a template</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TEMPLATES.map((tt) => (
                      <button
                        key={tt.id}
                        type="button"
                        onClick={() => setTpl(tt)}
                        className={`rounded-lg border p-3 text-center transition ${tpl.id === tt.id ? "border-foreground bg-foreground/5" : "border-border hover:bg-muted"}`}
                      >
                        <div className="text-xl">{tt.icon}</div>
                        <div className="mt-1 text-xs font-medium">{tt.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Sheet name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tpl.name} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
                  <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("create")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {sheets === undefined ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : sheets.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card">
            <EmptyState icon={BookOpen} title="No sheets yet" description="Create your first book sheet to start tracking financial data." action={{ onClick: () => setOpen(true), label: "New sheet" }} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sheets.map((s) => (
              <Link
                key={s._id}
                href={`/dashboard/book/${s._id}`}
                className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg text-lg" style={{ background: (s.color || "#22c55e") + "20" }}>
                      {s.icon || "📒"}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">{s.name}</h3>
                      <p className="text-xs text-muted-foreground">{(s.columns || []).length} columns</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault()
                      removeSheet({ sheetId: s._id })
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Updated {formatDate(s.updatedAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
