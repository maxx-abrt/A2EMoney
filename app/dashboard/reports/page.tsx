"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useWorkspace } from "@/lib/workspace-context"
import { formatCurrency, formatDate } from "@/lib/utils"
import { TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react"

function monthKey(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default function ReportsPage() {
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const currency = activeWorkspace?.currency ?? "EUR"
  const expenses = useQuery(api.a2e_expenses.list, wsId ? { workspaceId: wsId } : "skip")
  const invoices = useQuery(api.a2e_invoices.list, wsId ? { workspaceId: wsId } : "skip")

  const monthly = React.useMemo(() => {
    if (!expenses) return [] as { month: string; income: number; expense: number }[]
    const map = new Map<string, { income: number; expense: number }>()
    for (const e of expenses) {
      const k = monthKey(e.date)
      const m = map.get(k) ?? { income: 0, expense: 0 }
      if (e.type === "income") m.income += e.amount
      else m.expense += e.amount
      map.set(k, m)
    }
    return Array.from(map.entries())
      .sort()
      .slice(-12)
      .map(([month, v]) => ({ month, ...v }))
  }, [expenses])

  const byCategory = React.useMemo(() => {
    if (!expenses) return [] as { category: string; amount: number }[]
    const map = new Map<string, number>()
    for (const e of expenses) {
      if (e.type !== "expense") continue
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)
  }, [expenses])

  const totalIncome = (expenses ?? []).filter((e) => e.type === "income").reduce((a, b) => a + b.amount, 0)
  const totalExp = (expenses ?? []).filter((e) => e.type === "expense").reduce((a, b) => a + b.amount, 0)
  const totalInvoiced = (invoices ?? []).reduce((a, b) => a + b.items.reduce((c, d) => c + d.quantity * d.unitPrice, 0), 0)

  const maxMonth = Math.max(1, ...monthly.map((m) => Math.max(m.income, m.expense)))

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Aggregated insights across {activeWorkspace?.name}.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Total income" value={formatCurrency(totalIncome, currency)} icon={TrendingUp} tone="positive" />
          <KpiCard label="Total expenses" value={formatCurrency(totalExp, currency)} icon={TrendingDown} tone="negative" />
          <KpiCard label="Total invoiced" value={formatCurrency(totalInvoiced, currency)} icon={Wallet} tone="neutral" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Monthly income vs expenses</h2>
            {monthly.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted-foreground">No data yet.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {monthly.map((m) => (
                  <div key={m.month}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{m.month}</span>
                      <span><span className="text-accent">+{formatCurrency(m.income, currency)}</span> / <span className="text-destructive">-{formatCurrency(m.expense, currency)}</span></span>
                    </div>
                    <div className="mt-1 flex gap-1 h-2">
                      <div className="bg-accent rounded-l" style={{ width: `${(m.income / maxMonth) * 50}%` }} />
                      <div className="bg-destructive rounded-r" style={{ width: `${(m.expense / maxMonth) * 50}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Expenses by category</h2>
            {byCategory.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted-foreground">No expenses recorded.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {byCategory.map((c) => {
                  const pct = totalExp > 0 ? (c.amount / totalExp) * 100 : 0
                  return (
                    <li key={c.category}>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{c.category}</span>
                        <span className="text-muted-foreground">{formatCurrency(c.amount, currency)} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  tone: "positive" | "negative" | "neutral"
}) {
  const toneCls = tone === "positive" ? "text-accent" : tone === "negative" ? "text-destructive" : "text-foreground"
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${toneCls}`} />
      </div>
      <p className="mt-3 font-numeric text-2xl font-semibold">{value}</p>
    </div>
  )
}
