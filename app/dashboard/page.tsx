"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { useDataStore, formatCurrency, formatBytes, formatDate, type Invoice } from "@/lib/data-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader, StatCard } from "@/components/ui/page-header"
import { Tip } from "@/components/ui/tip"
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  FileText,
  HardDrive,
  Plus,
  Receipt,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"

function monthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** Compute total from an invoice's line items + optional VAT. */
function invoiceTotal(inv: Invoice): number {
  const subtotal = inv.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const tax = inv.taxRate ? subtotal * (inv.taxRate / 100) : 0
  return subtotal + tax
}

export default function DashboardHomePage() {
  const t = useTranslations("dashboard")
  const nav = useTranslations("nav")
  const {
    userProfile,
    transactions,
    invoices,
    bookEntries,
    documents,
    storage,
  } = useDataStore()

  const currency = userProfile?.currency || "EUR"
  const locale = userProfile?.locale
  const isBusiness = userProfile?.type === "business" || userProfile?.type === "association"

  const { monthlyIncome, monthlyExpenses, totalBalance } = useMemo(() => {
    const start = monthStart()
    let income = 0
    let expense = 0
    let balance = 0
    for (const tx of transactions) {
      const amt = tx.amount
      balance += amt
      if (new Date(tx.date) >= start) {
        if (tx.type === "income") income += Math.abs(amt)
        else expense += Math.abs(amt)
      }
    }
    return { monthlyIncome: income, monthlyExpenses: expense, totalBalance: balance }
  }, [transactions])

  const pendingInvoices = useMemo(
    () => invoices.filter(inv => inv.status === "sent" || inv.status === "overdue"),
    [invoices],
  )
  const pendingInvoicesAmount = pendingInvoices.reduce((sum, inv) => sum + invoiceTotal(inv), 0)

  const storagePercent = storage ? Math.min(100, (storage.used / storage.total) * 100) : 0
  const documentCount = documents?.length ?? storage?.documents?.length ?? 0
  const greeting = userProfile?.name ? `${t("welcome")}, ${userProfile.name.split(" ")[0]}` : t("welcome")

  const quickActions = [
    { href: "/dashboard/expenses?new=1", icon: Receipt, label: t("addExpense"), tone: "accent" as const },
    isBusiness
      ? { href: "/dashboard/invoices?new=1", icon: FileText, label: t("newInvoice"), tone: "default" as const }
      : { href: "/dashboard/budget", icon: Target, label: nav("budget"), tone: "default" as const },
    { href: "/dashboard/book", icon: BookOpen, label: nav("book"), tone: "default" as const },
    { href: "/dashboard/documents", icon: HardDrive, label: nav("documents"), tone: "default" as const },
  ]

  return (
    <div className="relative space-y-8 p-4 sm:p-8">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-accent/5 via-transparent to-transparent"
        aria-hidden
      />

      <div className="animate-fade-up">
        <PageHeader
          eyebrow={isBusiness ? t("businessDashboard") : t("personalFinance")}
          title={greeting}
          description={`Here's a snapshot of your ${new Date().toLocaleString("en", { month: "long" })} activity.`}
          actions={
            <>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/dashboard/expenses?new=1">
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t("addExpense")}
                </Link>
              </Button>
              {isBusiness && (
                <Button
                  asChild
                  size="sm"
                  className="rounded-full shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Link href="/dashboard/invoices?new=1">
                    <FileText className="mr-1.5 h-4 w-4" />
                    {t("newInvoice")}
                  </Link>
                </Button>
              )}
            </>
          }
        />
      </div>

      <div className="animate-fade-up delay-75">
        <Tip id="dashboard-welcome" variant="ai" title="Welcome to your finance cockpit">
          Everything below is connected — expenses you log, invoices you issue, and entries in your book all update
          these stats automatically. Press{" "}
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">⌘K</kbd> to jump anywhere or
          create things fast.
        </Tip>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-fade-up">
          <div className="group relative overflow-hidden rounded-xl border border-foreground bg-gradient-to-br from-foreground to-neutral-800 p-5 text-background shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/30 blur-2xl transition-transform duration-500 group-hover:scale-125"
              aria-hidden
            />
            <div className="relative flex items-center justify-between">
              <span className="text-sm font-medium text-background/70">{t("stats.totalBalance")}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/10">
                <Wallet className="h-4 w-4" />
              </span>
            </div>
            <div className="relative mt-3 font-numeric text-2xl font-semibold tracking-tight sm:text-3xl">
              {formatCurrency(totalBalance, currency, locale)}
            </div>
            <div className="relative mt-2 inline-flex items-center gap-1 rounded-md bg-background/10 px-1.5 py-0.5 text-[11px] font-medium text-background/80">
              <Sparkles className="h-3 w-3" /> All accounts combined
            </div>
          </div>
        </div>
        <div className="animate-fade-up delay-75">
          <StatCard
            label={t("stats.monthlyIncome")}
            value={formatCurrency(monthlyIncome, currency, locale)}
            icon={<TrendingUp className="h-4 w-4 text-accent" />}
            trend={{ value: t("stats.fromLastMonth"), direction: "up" }}
            className="bg-gradient-to-br from-card to-accent/5"
          />
        </div>
        <div className="animate-fade-up delay-150">
          <StatCard
            label={t("stats.monthlyExpenses")}
            value={formatCurrency(monthlyExpenses, currency, locale)}
            icon={<TrendingDown className="h-4 w-4 text-destructive" />}
            trend={{ value: t("stats.fromLastMonth"), direction: "down" }}
          />
        </div>
        <div className="animate-fade-up delay-300">
          <StatCard
            label={isBusiness ? t("stats.pendingInvoices") : t("stats.savingsGoal")}
            value={
              isBusiness
                ? formatCurrency(pendingInvoicesAmount, currency, locale)
                : formatCurrency(Math.max(0, monthlyIncome - monthlyExpenses), currency, locale)
            }
            hint={isBusiness ? `${pendingInvoices.length} pending` : "This month"}
            icon={
              isBusiness ? (
                <FileText className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Target className="h-4 w-4 text-accent" />
              )
            }
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, i) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md animate-fade-up",
              i === 0 && "delay-75",
              i === 1 && "delay-150",
              i === 2 && "delay-300",
              i === 3 && "delay-500",
            )}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/0 blur-2xl transition-all duration-500 group-hover:bg-accent/10"
              aria-hidden
            />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-accent/10 group-hover:text-accent">
              <action.icon className="h-4 w-4" />
            </div>
            <span className="relative flex-1 text-sm font-medium">{action.label}</span>
            <ArrowUpRight className="relative h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent transactions */}
        <section className="animate-fade-up rounded-xl border border-border bg-card lg:col-span-2 delay-150">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">{t("recentTransactions.title")}</h2>
              <p className="text-xs text-muted-foreground">{t("recentTransactions.description")}</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="group">
              <Link href="/dashboard/expenses">
                {t("recentTransactions.viewAll")}
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </header>
          <div className="divide-y divide-border">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-5 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No transactions yet</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Log your first expense or income to start tracking your cashflow.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-2 rounded-full">
                  <Link href="/dashboard/expenses?new=1">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {t("addExpense")}
                  </Link>
                </Button>
              </div>
            ) : (
              transactions.slice(0, 6).map(tx => {
                const positive = tx.amount >= 0
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-muted/40"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        positive ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.category} · {formatDate(tx.date, locale)}
                      </p>
                    </div>
                    <span className={cn("font-numeric font-medium", positive ? "text-accent" : "text-foreground")}>
                      {positive ? "+" : ""}
                      {formatCurrency(tx.amount, currency, locale)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Side column */}
        <div className="space-y-6">
          {isBusiness && (
            <section className="animate-fade-up rounded-xl border border-border bg-card delay-150">
              <header className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">{t("pendingInvoices.title")}</h2>
                  <p className="text-xs text-muted-foreground">{t("pendingInvoices.description")}</p>
                </div>
              </header>
              <div className="divide-y divide-border">
                {pendingInvoices.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 px-5 py-8 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
                      <Sparkles className="h-4 w-4 text-accent" />
                    </div>
                    <p className="text-xs text-muted-foreground">All clear — no pending invoices.</p>
                  </div>
                ) : (
                  pendingInvoices.slice(0, 4).map(inv => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{inv.client || inv.number}</p>
                        <p className="text-xs text-muted-foreground">#{inv.number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-numeric font-medium">
                          {formatCurrency(invoiceTotal(inv), currency, locale)}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "mt-1 text-[10px]",
                            inv.status === "overdue" && "border-destructive/30 bg-destructive/10 text-destructive",
                          )}
                        >
                          {inv.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-border px-5 py-3">
                <Button asChild variant="ghost" size="sm" className="group w-full">
                  <Link href="/dashboard/invoices">
                    {t("pendingInvoices.manage")}
                    <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </section>
          )}

          <section className="animate-fade-up rounded-xl border border-border bg-card delay-300">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">{t("bookEntries.title")}</h2>
                <p className="text-xs text-muted-foreground">{t("bookEntries.description")}</p>
              </div>
            </header>
            <div className="divide-y divide-border">
              {bookEntries.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 px-5 py-8 text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your book is empty. Create a sheet and start adding entries.
                  </p>
                </div>
              ) : (
                bookEntries.slice(0, 4).map(entry => {
                  const firstText = Object.values(entry.cells).find(v => typeof v === "string") as string | undefined
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{firstText || "Entry"}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(entry.updatedAt, locale)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="border-t border-border px-5 py-3">
              <Button asChild variant="ghost" size="sm" className="group w-full">
                <Link href="/dashboard/book">
                  {t("bookEntries.openBook")}
                  <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </section>

          <section className="animate-fade-up rounded-xl border border-border bg-card p-5 delay-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">{t("storage.title")}</h2>
                <p className="text-xs text-muted-foreground">
                  {documentCount} document{documentCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out",
                  storagePercent > 90 ? "from-destructive to-destructive" : "from-accent/70 to-accent",
                )}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {storage ? `${formatBytes(storage.used)} ${t("storage.of")}` : "—"}
              </span>
              <span className="font-numeric">{Math.round(storagePercent)}%</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
