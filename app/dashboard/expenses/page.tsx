"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useSearchParams } from "next/navigation"
import { useWorkspace } from "@/lib/workspace-context"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { GlassCard } from "@/components/glass-card"
import { useLoadingTimeout } from "@/lib/use-loading-timeout"
import { AttachmentsField } from "@/components/attachments-field"
import { Plus, Receipt, Trash2, Loader2, ArrowDownRight, ArrowUpRight, Search, Filter, Download } from "@/components/iconsax"
import { toast } from "sonner"
import { CATEGORIES, CATEGORY_I18N, PAYMENT_METHODS, PAYMENT_I18N } from "@/lib/options"

export default function ExpensesPage() {
  const t = useTranslations("pages.expenses")
  const tCommon = useTranslations("common")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const currency = activeWorkspace?.currency ?? "EUR"
  const searchParams = useSearchParams()

  const expenses = useQuery(api.a2e_expenses.list, wsId ? { workspaceId: wsId } : "skip")
  const projects = useQuery(api.projects.list, wsId ? { workspaceId: wsId } : "skip")
  const sheets = useQuery(api.a2e_books.listSheets, wsId ? { workspaceId: wsId } : "skip")
  const create = useMutation(api.a2e_expenses.create)
  const remove = useMutation(api.a2e_expenses.remove)

  const ledgerSheets = React.useMemo(() => (sheets ?? []).filter((s) => (s as any).type === "ledger"), [sheets])

  const projectMap = React.useMemo(() => {
    const m = new Map<string, any>()
    for (const p of projects ?? []) m.set(p._id, p)
    return m
  }, [projects])

  // Filters
  const [query, setQuery] = React.useState("")
  const [filterCategory, setFilterCategory] = React.useState<string>("all")
  const [filterType, setFilterType] = React.useState<string>("all")
  const [filterProject, setFilterProject] = React.useState<string>("all")
  const [filterStart, setFilterStart] = React.useState("")
  const [filterEnd, setFilterEnd] = React.useState("")
  const [showFilters, setShowFilters] = React.useState(false)
  const loadTimedOut = useLoadingTimeout(expenses === undefined)

  const filtered = React.useMemo(() => {
    let list = expenses ?? []
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((e) => e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
    }
    if (filterCategory !== "all") list = list.filter((e) => e.category === filterCategory)
    if (filterType !== "all") list = list.filter((e) => e.type === filterType)
    if (filterProject !== "all") list = list.filter((e) => e.projectId === filterProject)
    if (filterStart) {
      const start = new Date(filterStart).getTime()
      list = list.filter((e) => e.date >= start)
    }
    if (filterEnd) {
      const end = new Date(filterEnd).getTime() + 86400000
      list = list.filter((e) => e.date <= end)
    }
    return list
  }, [expenses, query, filterCategory, filterType, filterProject, filterStart, filterEnd])

  // Bulk selection
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const allSelected = filtered.length > 0 && selected.size === filtered.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleSelectAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map((e) => e._id)))
  }
  function toggleSelect(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  async function handleBulkDelete() {
    if (!confirm(t("bulkDeleteConfirm", { count: selected.size }))) return
    let deleted = 0
    for (const id of selected) {
      try {
        await remove({ expenseId: id as Id<"a2e_expenses"> })
        deleted++
      } catch {}
    }
    setSelected(new Set())
    toast.success(t("bulkDeleted", { count: deleted }))
  }

  // Create form
  const [open, setOpen] = React.useState(false)
  const [type, setType] = React.useState<"expense" | "income">("expense")
  const [description, setDescription] = React.useState("")
  const [amount, setAmount] = React.useState<string>("")
  const [category, setCategory] = React.useState("Other")
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0])
  const [paymentMethod, setPaymentMethod] = React.useState("Card")
  const [projectId, setProjectId] = React.useState<string>("")
  const [sheetId, setSheetId] = React.useState<string>("")
  const [notes, setNotes] = React.useState("")
  const [savedId, setSavedId] = React.useState<Id<"a2e_expenses"> | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (searchParams.get("new")) setOpen(true)
  }, [searchParams])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!wsId) return
    if (!description.trim() || !amount) return
    try {
      setSaving(true)
      const id = await create({
        workspaceId: wsId,
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        date: new Date(date).getTime(),
        paymentMethod,
        type,
        notes: notes.trim() || undefined,
        currency,
        projectId: projectId ? (projectId as Id<"projects">) : undefined,
        sheetId: sheetId ? (sheetId as Id<"a2e_bookSheets">) : undefined,
      })
      setSavedId(id)
      toast.success(type === "income" ? t("toasts.addedIncome") : t("toasts.addedExpense"))
    } catch (err: any) {
      toast.error(err?.message || t("toasts.failed"))
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setDescription(""); setAmount(""); setCategory("Other"); setNotes(""); setProjectId(""); setSheetId(""); setSavedId(null); setType("expense")
  }
  function closeDialog() { setOpen(false); setTimeout(resetForm, 200) }

  const totals = React.useMemo(() => {
    const list = filtered
    const income = list.filter((e) => e.type === "income").reduce((a, b) => a + b.amount, 0)
    const out = list.filter((e) => e.type === "expense").reduce((a, b) => a + b.amount, 0)
    return { income, out, net: income - out, count: list.length }
  }, [filtered])

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <Button variant="destructive" size="sm" className="gap-2" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4" /> {t("deleteSelected", { count: selected.size })}
              </Button>
            )}
            <Dialog open={open} onOpenChange={(o) => (o ? setOpen(o) : closeDialog())}>
              <DialogTrigger asChild><Button className="gap-2 rounded-full shadow-sm"><Plus className="h-4 w-4" /> {t("add")}</Button></DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>{savedId ? t("attach.title") : t("add")}</DialogTitle></DialogHeader>
                {!savedId ? (
                  <form onSubmit={handleSave} className="space-y-5">
                    <div className="flex gap-2">
                      {(["expense", "income"] as const).map((opt) => (
                        <button key={opt} type="button" onClick={() => setType(opt)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${type === opt ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}>
                          {t(opt)}
                        </button>
                      ))}
                    </div>
                    <div><Label>{tCommon("description")}</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>{tCommon("amount")} ({currency})</Label><Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
                      <div><Label>{tCommon("date")}</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{tCommon("category")}</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{tCommon(`categories.${CATEGORY_I18N[c]}`)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t("paymentMethod")}</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHODS.map((c) => <SelectItem key={c} value={c}>{tCommon(`paymentMethods.${PAYMENT_I18N[c]}`)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t("project")}</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                          <SelectTrigger className="w-full"><SelectValue placeholder={t("noProject")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">{t("noProject")}</SelectItem>
                            {(projects ?? []).map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      {ledgerSheets.length > 0 && (
                        <div>
                          <Label>{t("book")}</Label>
                          <Select value={sheetId} onValueChange={setSheetId}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">—</SelectItem>
                              {ledgerSheets.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div><Label>{tCommon("notes")}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={closeDialog}>{tCommon("cancel")}</Button>
                      <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tCommon("save")}</Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t("attach.description")}</p>
                    <AttachmentsField linkedTo={{ type: "expense", id: savedId }} documentType="receipt" max={10} />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={closeDialog}>{tCommon("done")}</Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter bar */}
        <GlassCard className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters((s) => !s)}>
              <Filter className="h-4 w-4" /> {t("filters")}
            </Button>
          </div>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 grid gap-3 sm:grid-cols-5"
            >
              <div>
                <Label className="text-xs">{tCommon("type")}</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allTypes")}</SelectItem>
                    <SelectItem value="expense">{t("expense")}</SelectItem>
                    <SelectItem value="income">{t("income")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{tCommon("category")}</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allCategories")}</SelectItem>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{tCommon(`categories.${CATEGORY_I18N[c]}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t("project")}</Label>
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allProjects")}</SelectItem>
                    {(projects ?? []).map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t("fromDate")}</Label>
                <Input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{t("toDate")}</Label>
                <Input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
              </div>
            </motion.div>
          )}
        </GlassCard>

        {/* Totals */}
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("stats.income")}</p>
            <p className="mt-1 text-xl font-semibold text-accent">{formatCurrency(totals.income, currency)}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("stats.expenses")}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(totals.out, currency)}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("stats.net")}</p>
            <p className={`mt-1 text-xl font-semibold ${totals.net >= 0 ? "text-accent" : "text-destructive"}`}>{formatCurrency(totals.net, currency)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("stats.count", { count: totals.count })}</p>
          </GlassCard>
        </div>

        {/* List */}
        <GlassCard>
          {expenses === undefined ? (
            <div className="flex items-center justify-center py-16">
              {loadTimedOut ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">{tCommon("errorOccurred")}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
                </div>
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={query || filterCategory !== "all" || filterType !== "all" ? t("empty.filteredTitle") : t("empty.title")}
              description={query || filterCategory !== "all" || filterType !== "all" ? t("empty.filteredDescription") : t("empty.description")}
              action={!query && filterCategory === "all" && filterType === "all" ? { onClick: () => setOpen(true), label: t("add") } : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="w-10 px-4 py-3">
                      <Checkbox
                        checked={allSelected}
                        data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{tCommon("description")}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{tCommon("category")}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{tCommon("date")}</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">{tCommon("amount")}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("project")}</th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tr, idx) => {
                    const isIn = tr.type === "income"
                    const isSelected = selected.has(tr._id)
                    return (
                      <motion.tr
                        key={tr._id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.01 * idx, duration: 0.25 }}
                        className={`border-b border-border/40 transition-colors hover:bg-muted/30 ${isSelected ? "bg-accent/5" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(tr._id)} aria-label="Select row" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isIn ? "bg-accent/10 text-accent" : "bg-muted text-foreground"}`}>
                              {isIn ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                            </div>
                            <div>
                              <p className="font-medium">{tr.description}</p>
                              {tr.notes && <p className="text-xs text-muted-foreground">{tr.notes}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">{tr.category}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(tr.date)}</td>
                        <td className={`px-4 py-3 text-right font-medium tabular-nums ${isIn ? "text-accent" : ""}`}>
                          {isIn ? "+" : "-"}{formatCurrency(tr.amount, currency)}
                        </td>
                        <td className="px-4 py-3">
                          {tr.projectId && projectMap.get(tr.projectId) ? (
                            <Link href={`/dashboard/projects/${tr.projectId}`} className="text-xs text-accent hover:underline">
                              {projectMap.get(tr.projectId).name}
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove({ expenseId: tr._id })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
