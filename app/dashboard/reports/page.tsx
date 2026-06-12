"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useWorkspace } from "@/lib/workspace-context"
import {
  AdvancedNormalizedIncidentReport,
  ActivityStatsCard,
  CategoryBreakdownBar,
  BudgetGauge,
  type Txn,
} from "@/components/charts/analytics"
import { TrendUp, TrendDown, Wallet2, ReceiptItem } from "@/components/iconsax"

export default function ReportsPage() {
  const t = useTranslations("pages.reports")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const currency = activeWorkspace?.currency ?? "EUR"
  const expenses = useQuery(api.a2e_expenses.list, wsId ? { workspaceId: wsId } : "skip")
  const invoices = useQuery(api.a2e_invoices.list, wsId ? { workspaceId: wsId } : "skip")
  const budgets = useQuery(api.a2e_budgets.list, wsId ? { workspaceId: wsId } : "skip")

  const transactions: Txn[] = React.useMemo(
    () =>
      (expenses ?? []).map((e) => ({
        date: e.date,
        amount: e.amount,
        type: e.type as "income" | "expense",
        category: e.category,
      })),
    [expenses],
  )

  /* KPI math */
  const now = Date.now()
  const month = 30 * 86400 * 1000
  const lastWindow = now - month
  const prevWindow = now - 2 * month

  const inc = (expenses ?? []).filter((e) => e.type === "income")
  const exp = (expenses ?? []).filter((e) => e.type === "expense")
  const totalIncome = inc.reduce((a, b) => a + b.amount, 0)
  const totalExpense = exp.reduce((a, b) => a + b.amount, 0)
  const totalInvoiced = (invoices ?? []).reduce(
    (a, b) => a + b.items.reduce((c, d) => c + d.quantity * d.unitPrice, 0),
    0,
  )

  const incomeLast = inc.filter((e) => e.date >= lastWindow).reduce((a, b) => a + b.amount, 0)
  const incomePrev = inc
    .filter((e) => e.date >= prevWindow && e.date < lastWindow)
    .reduce((a, b) => a + b.amount, 0)
  const expenseLast = exp.filter((e) => e.date >= lastWindow).reduce((a, b) => a + b.amount, 0)
  const expensePrev = exp
    .filter((e) => e.date >= prevWindow && e.date < lastWindow)
    .reduce((a, b) => a + b.amount, 0)

  /* Sparkline series — last 12 weeks */
  const sparkData = React.useMemo(() => {
    const weeks = 12
    const incomeSeries = new Array(weeks).fill(0) as number[]
    const expenseSeries = new Array(weeks).fill(0) as number[]
    const oneWeek = 7 * 86400 * 1000
    const start = now - weeks * oneWeek
    for (const tr of expenses ?? []) {
      if (tr.date < start) continue
      const idx = Math.min(weeks - 1, Math.floor((tr.date - start) / oneWeek))
      if (tr.type === "income") incomeSeries[idx] += tr.amount
      else expenseSeries[idx] += tr.amount
    }
    return { incomeSeries, expenseSeries }
  }, [expenses, now])

  /* Category breakdown */
  const byCategory = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const e of exp) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)
  }, [exp])

  /* Budget consumption */
  const budgetUsage = React.useMemo(() => {
    return (budgets ?? []).slice(0, 3).map((b) => {
      const used = exp
        .filter((e) => !b.category || e.category === b.category)
        .filter((e) => e.date >= (b.startDate ?? 0))
        .reduce((a, c) => a + c.amount, 0)
      return { name: b.name, used, total: b.amount }
    })
  }, [budgets, exp])

  return (
    <div className="relative px-4 py-8 sm:px-6 lg:px-8">
      <BgGlow />
      <div className="relative mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("description", { workspace: activeWorkspace?.name ?? "" })}
          </p>
        </div>

        {/* KPI strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ActivityStatsCard
            label={t("totals.income")}
            value={totalIncome}
            previousValue={incomePrev || undefined}
            series={sparkData.incomeSeries}
            currency={currency}
            tone="positive"
            icon={TrendUp}
            delay={0}
          />
          <ActivityStatsCard
            label={t("totals.expenses")}
            value={totalExpense}
            previousValue={expensePrev || undefined}
            series={sparkData.expenseSeries}
            currency={currency}
            tone="negative"
            icon={TrendDown}
            delay={0.05}
          />
          <ActivityStatsCard
            label={t("totals.invoiced")}
            value={totalInvoiced}
            series={sparkData.incomeSeries}
            currency={currency}
            tone="neutral"
            icon={ReceiptItem}
            delay={0.1}
          />
          <ActivityStatsCard
            label={t("totals.net")}
            value={totalIncome - totalExpense}
            previousValue={(incomePrev || 0) - (expensePrev || 0)}
            series={sparkData.incomeSeries.map((v, i) => v - (sparkData.expenseSeries[i] ?? 0))}
            currency={currency}
            tone={totalIncome - totalExpense >= 0 ? "positive" : "negative"}
            icon={Wallet2}
            delay={0.15}
          />
        </div>

        {/* Composition */}
        <AdvancedNormalizedIncidentReport transactions={transactions} currency={currency} />

        {/* Category + Budgets */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CategoryBreakdownBar data={byCategory} currency={currency} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {budgetUsage.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-5 text-center text-xs text-muted-foreground backdrop-blur-xl">
                {t("noData")}
              </div>
            ) : (
              budgetUsage.map((b) => (
                <BudgetGauge
                  key={b.name}
                  label={b.name}
                  spent={b.used}
                  total={b.total}
                  currency={currency}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BgGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden">
      <div className="absolute left-1/4 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute right-1/4 top-10 h-64 w-64 translate-x-1/2 rounded-full bg-fuchsia-400/10 blur-3xl" />
    </div>
  )
}
