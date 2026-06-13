"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useWorkspace } from "@/lib/workspace-context"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Breadcrumbs } from "@/components/breadcrumbs"
import {
  ArrowLeft,
  Plus,
  Download,
  Loader2,
  Trash2,
  Paperclip,
} from "@/components/iconsax"
import { toast } from "sonner"
import { exportToXLSX, exportToCSV } from "@/lib/export"
import { CATEGORIES, CATEGORY_I18N, PAYMENT_METHODS, PAYMENT_I18N } from "@/lib/options"

export default function BookSheetPage() {
  const t = useTranslations("pages.book")
  const tCommon = useTranslations("common")
  const params = useParams<{ id: string }>()
  const sheetId = params?.id as Id<"a2e_bookSheets">
  const { activeWorkspace } = useWorkspace()
  const currency = activeWorkspace?.currency ?? "EUR"

  const sheet = useQuery(api.a2e_books.getSheet, sheetId ? { sheetId } : "skip")
  const isLedger = (sheet as any)?.type === "ledger"

  // Grid mode
  const entries = useQuery(api.a2e_books.listEntries, sheetId && !isLedger ? { sheetId } : "skip")
  const createEntry = useMutation(api.a2e_books.createEntry)
  const updateEntry = useMutation(api.a2e_books.updateEntry)
  const removeEntry = useMutation(api.a2e_books.removeEntry)

  // Ledger mode
  const ledgerExpenses = useQuery(api.a2e_expenses.listBySheet, sheetId && isLedger ? { sheetId } : "skip")
  const createExpense = useMutation(api.a2e_expenses.create)
  const updateExpense = useMutation(api.a2e_expenses.update)
  const removeExpense = useMutation(api.a2e_expenses.remove)
  const projects = useQuery(api.projects.list, activeWorkspace?._id ? { workspaceId: activeWorkspace._id } : "skip")

  const [draft, setDraft] = React.useState<Record<string, any>>({})
  const [ledgerDraft, setLedgerDraft] = React.useState({
    description: "",
    amount: "",
    category: "Other",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Card",
    type: "expense" as "expense" | "income",
    projectId: "",
  })

  const projectMap = React.useMemo(() => {
    const m = new Map<string, any>()
    for (const p of projects ?? []) m.set(p._id, p)
    return m
  }, [projects])

  if (!sheet) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const columns: any[] = (sheet as any).columns || []

  // Grid handlers
  async function handleAddRow(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createEntry({ sheetId, cells: draft })
      setDraft({})
    } catch (err: any) {
      toast.error(err?.message || t("toasts.addRowFailed"))
    }
  }

  async function handleCellEdit(entryId: Id<"a2e_bookEntries">, colId: string, value: any) {
    const entry = entries?.find((e) => e._id === entryId)
    if (!entry) return
    await updateEntry({ entryId, cells: { ...(entry.cells || {}), [colId]: value } })
  }

  // Ledger handlers
  async function handleAddLedgerRow(e: React.FormEvent) {
    e.preventDefault()
    if (!activeWorkspace?._id) return
    try {
      await createExpense({
        workspaceId: activeWorkspace._id,
        sheetId,
        description: ledgerDraft.description.trim(),
        amount: parseFloat(ledgerDraft.amount),
        category: ledgerDraft.category,
        date: new Date(ledgerDraft.date).getTime(),
        paymentMethod: ledgerDraft.paymentMethod,
        type: ledgerDraft.type,
        currency,
        projectId: ledgerDraft.projectId ? (ledgerDraft.projectId as Id<"projects">) : undefined,
      })
      setLedgerDraft({ description: "", amount: "", category: "Other", date: new Date().toISOString().split("T")[0], paymentMethod: "Card", type: "expense", projectId: "" })
    } catch (err: any) {
      toast.error(err?.message || t("toasts.addTransactionFailed"))
    }
  }

  async function handleLedgerCellEdit(expenseId: Id<"a2e_expenses">, field: string, value: any) {
    const patch: any = {}
    if (field === "date") patch.date = new Date(value).getTime()
    else if (field === "amount") patch.amount = parseFloat(value) || 0
    else patch[field] = value
    await updateExpense({ expenseId, ...patch })
  }

  function handleExport(fmt: "csv" | "xlsx") {
    if (!sheet) return
    if (isLedger) {
      const h = [t("table.date"), t("table.description"), t("table.category"), t("table.type"), t("table.amount"), t("table.project"), t("table.payment"), t("table.notes")]
      const rows = (ledgerExpenses ?? []).map((e) => [
        formatDate(e.date), e.description, e.category, e.type, String(e.amount),
        projects?.find((p) => p._id === e.projectId)?.name || "", e.paymentMethod, e.notes || "",
      ])
      if (fmt === "csv") exportToCSV(sheet.name, h, rows)
      else exportToXLSX(sheet.name, h, rows)
    } else {
      const headers = columns.map((c: any) => c.name)
      const rows = (entries ?? []).map((e) => columns.map((c: any) => formatCell(e.cells?.[c.id], c.type)))
      if (fmt === "csv") exportToCSV(sheet.name, headers, rows)
      else exportToXLSX(sheet.name, headers, rows)
    }
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Breadcrumbs
          crumbs={[
            { label: "Books", href: "/dashboard/book" },
            { label: sheet.name },
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href="/dashboard/book"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg text-lg" style={{ background: (sheet.color || "#22c55e") + "20" }}>
                {sheet.icon || "📒"}
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{sheet.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {isLedger ? t("type.ledger") : t("type.grid")} · {t("rows", { count: isLedger ? (ledgerExpenses ?? []).length : (entries ?? []).length })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport("csv")} className="gap-2"><Download className="h-3.5 w-3.5" /> CSV</Button>
            <Button variant="outline" onClick={() => handleExport("xlsx")} className="gap-2"><Download className="h-3.5 w-3.5" /> XLSX</Button>
          </div>
        </div>

        {isLedger ? (
          <LedgerTable
            expenses={ledgerExpenses}
            projects={projectMap}
            onCellEdit={handleLedgerCellEdit}
            onDelete={(id: Id<"a2e_expenses">) => removeExpense({ expenseId: id })}
            draft={ledgerDraft}
            setDraft={setLedgerDraft}
            onAdd={handleAddLedgerRow}
            t={t}
            tCommon={tCommon}
          />
        ) : (
          <GridTable
            columns={columns}
            entries={entries}
            draft={draft}
            setDraft={setDraft}
            onCellEdit={handleCellEdit}
            onDelete={(id: Id<"a2e_bookEntries">) => removeEntry({ entryId: id })}
            onAdd={handleAddRow}
          />
        )}
      </div>
    </div>
  )
}

function LedgerTable({
  expenses,
  projects,
  onCellEdit,
  onDelete,
  draft,
  setDraft,
  onAdd,
  t,
  tCommon,
}: {
  expenses: any[] | undefined
  projects: Map<string, any>
  onCellEdit: (id: Id<"a2e_expenses">, field: string, value: any) => void
  onDelete: (id: Id<"a2e_expenses">) => void
  draft: any
  setDraft: React.Dispatch<React.SetStateAction<any>>
  onAdd: (e: React.FormEvent) => void
  t: (k: string) => string
  tCommon: (k: string) => string
}) {
  // Compute running balance (oldest -> newest)
  const balanceMap = React.useMemo(() => {
    const sorted = [...(expenses ?? [])].sort((a, b) => a.date - b.date)
    const map = new Map<string, number>()
    let bal = 0
    for (const e of sorted) {
      bal += e.type === "income" ? e.amount : -e.amount
      map.set(e._id, bal)
    }
    return map
  }, [expenses])

  if (!expenses) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-1 px-0 py-2.5" />
              <th className="w-1 px-4 py-2.5" />
              <th className="px-4 py-2.5">{t("table.date")}</th>
              <th className="px-4 py-2.5">{t("table.description")}</th>
              <th className="px-4 py-2.5">{t("table.category")}</th>
              <th className="px-4 py-2.5">{t("table.type")}</th>
              <th className="px-4 py-2.5">{t("table.amount")}</th>
              <th className="px-4 py-2.5">{t("table.balance")}</th>
              <th className="px-4 py-2.5">{t("table.project")}</th>
              <th className="px-4 py-2.5">{t("table.payment")}</th>
              <th className="px-4 py-2.5">{t("table.notes")}</th>
              <th className="px-4 py-2.5 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {expenses.map((e) => {
              const proj = e.projectId ? projects.get(e.projectId) : null
              const color = proj?.color
              return (
                <tr key={e._id} className="hover:bg-muted/20">
                  <td className="w-1 px-0 py-0">
                    <div className="flex h-full items-center">
                      {color && <div className="h-8 w-1 rounded-r-full" style={{ background: color }} />}
                    </div>
                  </td>
                  <td className="px-1 py-2">
                    {e.linkedDocuments?.length > 0 && (
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="date"
                      value={new Date(e.date).toISOString().split("T")[0]}
                      onChange={(ev) => onCellEdit(e._id, "date", ev.target.value)}
                      className="h-7 text-xs border-none bg-transparent shadow-none focus-visible:ring-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={e.description}
                      onChange={(ev) => onCellEdit(e._id, "description", ev.target.value)}
                      className="h-7 text-sm border-none bg-transparent shadow-none focus-visible:ring-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Select value={e.category} onValueChange={(v) => onCellEdit(e._id, "category", v)}>
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{tCommon(`categories.${CATEGORY_I18N[c]}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="secondary" className={e.type === "income" ? "bg-accent/10 text-accent" : "bg-muted text-foreground"}>
                      {e.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={e.amount}
                      onChange={(ev) => onCellEdit(e._id, "amount", ev.target.value)}
                      className="h-7 text-sm border-none bg-transparent shadow-none focus-visible:ring-1 font-numeric"
                    />
                  </td>
                  <td className="px-4 py-2 font-numeric text-xs tabular-nums">
                    {formatCurrency(balanceMap.get(e._id) ?? 0, "EUR")}
                  </td>
                  <td className="px-4 py-2">
                    {proj ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <span className="h-2 w-2 rounded-full" style={{ background: proj.color || "#ccc" }} />
                        {proj.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("table.project")}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Select value={e.paymentMethod} onValueChange={(v) => onCellEdit(e._id, "paymentMethod", v)}>
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{tCommon(`paymentMethods.${PAYMENT_I18N[m]}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={e.notes || ""}
                      onChange={(ev) => onCellEdit(e._id, "notes", ev.target.value)}
                      className="h-7 text-xs border-none bg-transparent shadow-none focus-visible:ring-1"
                      placeholder="Notes"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(e._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              )
            })}
            {/* Add row */}
            <tr className="bg-muted/20">
              <td className="px-0 py-2" />
              <td className="px-1 py-2" />
              <td className="px-4 py-2">
                <Input type="date" value={draft.date} onChange={(ev) => setDraft((d: any) => ({ ...d, date: ev.target.value }))} className="h-7 text-xs" />
              </td>
              <td className="px-4 py-2">
                <Input value={draft.description} onChange={(ev) => setDraft((d: any) => ({ ...d, description: ev.target.value }))} className="h-7 text-sm" placeholder={t("placeholder.description")} />
              </td>
              <td className="px-4 py-2">
                <Select value={draft.category} onValueChange={(v) => setDraft((d: any) => ({ ...d, category: v }))}>
                  <SelectTrigger className="h-7 w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-2">
                <div className="flex gap-1">
                  {(["expense", "income"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setDraft((d: any) => ({ ...d, type: t }))}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${draft.type === t ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </td>
              <td className="px-4 py-2">
                <Input type="number" step="0.01" value={draft.amount} onChange={(ev) => setDraft((d: any) => ({ ...d, amount: ev.target.value }))} className="h-7 text-sm font-numeric" placeholder={t("placeholder.amount")} />
              </td>
              <td className="px-4 py-2" />
              <td className="px-4 py-2">
                <Select value={draft.projectId} onValueChange={(v) => setDraft((d: any) => ({ ...d, projectId: v }))}>
                  <SelectTrigger className="h-7 w-full text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {Array.from(projects.values()).map((p: any) => (
                      <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-2">
                <Select value={draft.paymentMethod} onValueChange={(v) => setDraft((d: any) => ({ ...d, paymentMethod: v }))}>
                  <SelectTrigger className="h-7 w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-2">
                <Input value={draft.notes || ""} onChange={(ev) => setDraft((d: any) => ({ ...d, notes: ev.target.value }))} className="h-7 text-xs" placeholder={t("placeholder.notes")} />
              </td>
              <td className="px-4 py-2 text-right">
                <Button size="sm" className="gap-1" onClick={onAdd}>
                  <Plus className="h-3 w-3" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GridTable({
  columns,
  entries,
  draft,
  setDraft,
  onCellEdit,
  onDelete,
  onAdd,
}: {
  columns: any[]
  entries: any[] | undefined
  draft: Record<string, any>
  setDraft: React.Dispatch<React.SetStateAction<Record<string, any>>>
  onCellEdit: (entryId: Id<"a2e_bookEntries">, colId: string, value: any) => void
  onDelete: (id: Id<"a2e_bookEntries">) => void
  onAdd: (e: React.FormEvent) => void
}) {
  if (!entries) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {columns.map((c: any) => (
                <th key={c.id} className="px-4 py-2.5">{c.name}</th>
              ))}
              <th className="px-4 py-2.5 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(entries ?? []).map((e) => (
              <tr key={e._id} className="hover:bg-muted/20">
                {columns.map((c: any) => (
                  <td key={c.id} className="px-4 py-2">
                    <CellEditor column={c} value={e.cells?.[c.id]} onChange={(v) => onCellEdit(e._id, c.id, v)} />
                  </td>
                ))}
                <td className="px-4 py-2 text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(e._id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-2">
                <form onSubmit={onAdd} className="flex flex-wrap items-end gap-2">
                  {columns.map((c: any) => (
                    <div key={c.id} className="min-w-[120px] flex-1">
                      <CellEditor column={c} value={draft[c.id]} onChange={(v) => setDraft((prev) => ({ ...prev, [c.id]: v }))} compact />
                    </div>
                  ))}
                  <Button type="submit" size="sm" className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
                </form>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CellEditor({
  column,
  value,
  onChange,
  compact,
}: {
  column: any
  value: any
  onChange: (v: any) => void
  compact?: boolean
}) {
  const cls = compact
    ? "h-8 text-xs"
    : "h-8 text-sm border-none bg-transparent shadow-none focus-visible:ring-1"

  if (column.type === "checkbox") {
    return (
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    )
  }
  if (column.type === "select") {
    return (
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger className={cls}><SelectValue placeholder="—" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">—</SelectItem>
          {(column.options || []).map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
        </SelectContent>
      </Select>
    )
  }
  if (column.type === "date") {
    return <Input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={cls} />
  }
  if (column.type === "number" || column.type === "currency") {
    return <Input type="number" step="0.01" value={value ?? ""} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className={cls} />
  }
  return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={column.name} />
}

function formatCell(val: any, type: string): string {
  if (val === undefined || val === null || val === "") return ""
  if (type === "checkbox") return val ? "TRUE" : "FALSE"
  if (type === "date") return String(val)
  return String(val)
}
