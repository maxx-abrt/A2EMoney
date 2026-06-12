"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useWorkspace } from "@/lib/workspace-context"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/empty-state"
import { AttachmentsField } from "@/components/attachments-field"
import { Plus, Receipt, Trash2, Loader2, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Office",
  "Marketing",
  "Software",
  "Travel",
  "Salaries",
  "Taxes",
  "Utilities",
  "Other",
]

const PAYMENT_METHODS = ["Card", "Bank transfer", "Cash", "PayPal", "Other"]

export default function ExpensesPage() {
  const t = useTranslations("common")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const currency = activeWorkspace?.currency ?? "EUR"
  const searchParams = useSearchParams()
  const expenses = useQuery(api.a2e_expenses.list, wsId ? { workspaceId: wsId } : "skip")
  const projects = useQuery(api.projects.list, wsId ? { workspaceId: wsId } : "skip")
  const create = useMutation(api.a2e_expenses.create)
  const remove = useMutation(api.a2e_expenses.remove)

  const [open, setOpen] = React.useState(false)
  const [type, setType] = React.useState<"expense" | "income">("expense")
  const [description, setDescription] = React.useState("")
  const [amount, setAmount] = React.useState<string>("")
  const [category, setCategory] = React.useState("Other")
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0])
  const [paymentMethod, setPaymentMethod] = React.useState("Card")
  const [projectId, setProjectId] = React.useState<string>("")
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
      })
      setSavedId(id)
      toast.success(type === "income" ? "Income added" : "Expense added")
    } catch (err: any) {
      toast.error(err?.message || "Could not save")
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setDescription("")
    setAmount("")
    setCategory("Other")
    setNotes("")
    setProjectId("")
    setSavedId(null)
    setType("expense")
  }

  function closeDialog() {
    setOpen(false)
    setTimeout(resetForm, 200)
  }

  const totals = React.useMemo(() => {
    const list = expenses ?? []
    const income = list.filter((e) => e.type === "income").reduce((a, b) => a + b.amount, 0)
    const out = list.filter((e) => e.type === "expense").reduce((a, b) => a + b.amount, 0)
    return { income, out, net: income - out }
  }, [expenses])

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Expenses & Income</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track money in and out, attach receipts, link to projects.
            </p>
          </div>
          <Dialog open={open} onOpenChange={(o) => (o ? setOpen(o) : closeDialog())}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{savedId ? "Attach receipts" : "Add a transaction"}</DialogTitle>
              </DialogHeader>
              {!savedId ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="flex gap-2">
                    {(["expense", "income"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setType(opt)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          type === opt
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {opt === "expense" ? "Expense" : "Income"}
                      </button>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="desc">{t("description")}</Label>
                    <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amt">{t("amount")} ({currency})</Label>
                      <Input id="amt" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="date">{t("date")}</Label>
                      <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cat">{t("category")}</Label>
                      <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="pay">Payment method</Label>
                      <select id="pay" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                        {PAYMENT_METHODS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  {(projects ?? []).length > 0 && (
                    <div>
                      <Label htmlFor="proj">Project (optional)</Label>
                      <select id="proj" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                        <option value="">— No project —</option>
                        {(projects ?? []).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="notes">{t("notes")}</Label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeDialog}>{t("cancel")}</Button>
                    <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}</Button>
                  </DialogFooter>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Add receipts or supporting documents. They'll be linked automatically.</p>
                  <AttachmentsField linkedTo={{ type: "expense", id: savedId }} documentType="receipt" />
                  <DialogFooter>
                    <Button onClick={closeDialog}>Done</Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Totals */}
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Total income" value={formatCurrency(totals.income, currency)} tone="positive" />
          <SummaryCard label="Total expenses" value={formatCurrency(totals.out, currency)} tone="negative" />
          <SummaryCard label="Net" value={formatCurrency(totals.net, currency)} tone={totals.net >= 0 ? "positive" : "negative"} />
        </div>

        {/* List */}
        <div className="rounded-2xl border border-border bg-card">
          {expenses === undefined ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Log your first expense or income to see it here."
              action={{ onClick: () => setOpen(true), label: "Add transaction" }}
            />
          ) : (
            <ul className="divide-y divide-border">
              {expenses.map((e) => (
                <li key={e._id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${e.type === "income" ? "bg-accent/10 text-accent" : "bg-muted"}`}>
                      {e.type === "income" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(e.date)} · {e.category} · {e.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`font-numeric text-sm font-medium ${e.type === "income" ? "text-accent" : "text-foreground"}`}>
                      {e.type === "income" ? "+" : "-"}{formatCurrency(e.amount, e.currency ?? currency)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove({ expenseId: e._id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "positive" | "negative" | "neutral" }) {
  const toneCls = tone === "positive" ? "text-accent" : tone === "negative" ? "text-destructive" : "text-foreground"
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 font-numeric text-2xl font-semibold ${toneCls}`}>{value}</p>
    </div>
  )
}
