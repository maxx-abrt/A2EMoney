"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useWorkspace } from "@/lib/workspace-context"
import { formatCurrency, formatDate, formatBytes } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Receipt,
  FileText,
  PiggyBank,
  BookOpen,
  Wallet,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Activity as ActivityIcon,
} from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export default function DashboardPage() {
  const t = useTranslations("dashboard")
  const tCommon = useTranslations("common")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const currency = activeWorkspace?.currency ?? "EUR"

  const invoices = useQuery(api.a2e_invoices.list, wsId ? { workspaceId: wsId } : "skip")
  const expenses = useQuery(api.a2e_expenses.list, wsId ? { workspaceId: wsId } : "skip")
  const projects = useQuery(api.projects.list, wsId ? { workspaceId: wsId } : "skip")
  const activities = useQuery(
    api.activities.list,
    wsId ? { workspaceId: wsId, limit: 6 } : "skip",
  )

  const now = Date.now()
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000

  const totals = React.useMemo(() => {
    const exps = expenses ?? []
    const income = exps.filter((e) => e.type === "income").reduce((a, b) => a + b.amount, 0)
    const out = exps.filter((e) => e.type === "expense").reduce((a, b) => a + b.amount, 0)
    const incomeMonth = exps
      .filter((e) => e.type === "income" && e.date >= monthAgo)
      .reduce((a, b) => a + b.amount, 0)
    const outMonth = exps
      .filter((e) => e.type === "expense" && e.date >= monthAgo)
      .reduce((a, b) => a + b.amount, 0)
    return {
      balance: income - out,
      income,
      out,
      incomeMonth,
      outMonth,
    }
  }, [expenses, monthAgo])

  const pendingInvoices = (invoices ?? []).filter(
    (inv) => inv.status === "sent" || inv.status === "overdue",
  )

  const recentTransactions = React.useMemo(() => {
    return (expenses ?? [])
      .slice()
      .sort((a, b) => b.date - a.date)
      .slice(0, 6)
  }, [expenses])

  if (!activeWorkspace) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          icon={Wallet}
          title={t("welcome")}
          description="Select or create a workspace to continue."
        />
      </div>
    )
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t("welcome")}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {activeWorkspace.name}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              {activeWorkspace.type === "business" ? (
                <Building2 className="h-3.5 w-3.5" />
              ) : activeWorkspace.type === "association" ? (
                <Users className="h-3.5 w-3.5" />
              ) : (
                <Wallet className="h-3.5 w-3.5" />
              )}
              <span>{activeWorkspace.type ?? "workspace"}</span>
              <span>·</span>
              <span>{activeWorkspace.role}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/dashboard/expenses?new=1">
                <Plus className="h-4 w-4" />
                {t("addExpense")}
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link href="/dashboard/invoices?new=1">
                <Plus className="h-4 w-4" />
                {t("newInvoice")}
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={t("stats.totalBalance")}
            value={formatCurrency(totals.balance, currency)}
            tone={totals.balance >= 0 ? "positive" : "negative"}
            icon={Wallet}
          />
          <KpiCard
            label={t("stats.monthlyIncome")}
            value={formatCurrency(totals.incomeMonth, currency)}
            tone="positive"
            icon={TrendingUp}
          />
          <KpiCard
            label={t("stats.monthlyExpenses")}
            value={formatCurrency(totals.outMonth, currency)}
            tone="negative"
            icon={TrendingDown}
          />
          <KpiCard
            label={t("stats.pendingInvoices")}
            value={String(pendingInvoices.length)}
            tone="neutral"
            icon={FileText}
          />
        </div>

        {/* Recent transactions + pending invoices */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-sm font-semibold">{t("recentTransactions.title")}</h2>
                <p className="text-xs text-muted-foreground">{t("recentTransactions.description")}</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1">
                <Link href="/dashboard/expenses">
                  {t("recentTransactions.viewAll")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            {recentTransactions.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={t("recentTransactions.title")}
                description="Log your first expense or income to see it here."
                action={{ href: "/dashboard/expenses?new=1", label: t("addExpense") }}
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentTransactions.map((tr) => {
                  const isIn = tr.type === "income"
                  return (
                    <li key={tr._id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            isIn ? "bg-accent/10 text-accent" : "bg-muted text-foreground"
                          }`}
                        >
                          {isIn ? (
                            <ArrowDownRight className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{tr.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(tr.date)} · {tr.category}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 font-numeric text-sm font-medium ${
                          isIn ? "text-accent" : "text-foreground"
                        }`}
                      >
                        {isIn ? "+" : "-"}
                        {formatCurrency(tr.amount, tr.currency ?? currency)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h2 className="text-sm font-semibold">{t("pendingInvoices.title")}</h2>
                  <p className="text-xs text-muted-foreground">{t("pendingInvoices.description")}</p>
                </div>
              </div>
              {pendingInvoices.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title={t("pendingInvoices.title")}
                  description="Create your first invoice to start tracking payments."
                  action={{ href: "/dashboard/invoices?new=1", label: t("newInvoice") }}
                />
              ) : (
                <ul className="divide-y divide-border">
                  {pendingInvoices.slice(0, 5).map((inv) => {
                    const total = inv.items.reduce(
                      (a, b) => a + b.quantity * b.unitPrice,
                      0,
                    )
                    return (
                      <li
                        key={inv._id}
                        className="flex items-center justify-between gap-3 px-5 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{inv.client}</p>
                          <p className="text-xs text-muted-foreground">
                            {inv.number} · {formatDate(inv.dueDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              inv.status === "overdue"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                            }
                          >
                            {inv.status}
                          </Badge>
                          <span className="font-numeric text-sm font-medium">
                            {formatCurrency(total, inv.currency)}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              <div className="border-t border-border p-3">
                <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                  <Link href="/dashboard/invoices">{t("pendingInvoices.manage")}</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h2 className="text-sm font-semibold">Latest activity</h2>
                  <p className="text-xs text-muted-foreground">Team & workspace changes</p>
                </div>
              </div>
              {(activities ?? []).length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                  Nothing happened yet.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {(activities ?? []).map((a: any) => (
                    <li key={a._id} className="flex items-start gap-3 px-5 py-3 text-xs">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <ActivityIcon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {a.actor?.name ?? a.actor?.email ?? "Someone"}{" "}
                          <span className="font-normal text-muted-foreground">
                            {a.action.replace(/_/g, " ").replace(/\./g, " ")}
                          </span>
                        </p>
                        <p className="text-muted-foreground">{formatDate(a.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string
  value: string
  tone: "positive" | "negative" | "neutral"
  icon: React.ComponentType<{ className?: string }>
}) {
  const toneClass =
    tone === "positive"
      ? "bg-accent/10 text-accent"
      : tone === "negative"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-foreground"
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${toneClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-3 font-numeric text-2xl font-semibold">{value}</p>
    </div>
  )
}
