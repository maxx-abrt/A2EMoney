"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useDataStore, formatCurrency, formatBytes } from "@/lib/data-store"
import { useTranslations } from "next-intl"
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CreditCard,
  FileText,
  FolderOpen,
  MoreHorizontal,
  PieChart,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { userProfile, transactions = [], invoices = [], bookEntries = [], documents = [] } = useDataStore()
  const t = useTranslations()
  const currency = userProfile?.currency || "EUR"
  const isBusiness = userProfile?.type !== "individual"

  // Calculate real stats from data
  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0)
  const monthlyIncome = transactions
    .filter(t => t.type === "income" && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0)
  const monthlyExpenses = Math.abs(transactions
    .filter(t => t.type === "expense" && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0))
  const pendingInvoicesTotal = invoices
    .filter(inv => inv.status === "pending" || inv.status === "sent")
    .reduce((sum, inv) => sum + inv.total, 0)
  const pendingInvoicesCount = invoices.filter(inv => inv.status === "pending" || inv.status === "sent").length

  // Recent items
  const recentTransactions = transactions.slice(0, 5)
  const recentInvoices = invoices.filter(inv => inv.status !== "paid").slice(0, 3)
  const recentBookEntries = bookEntries.slice(0, 3)

  // Storage used
  const storageUsed = documents.reduce((sum, doc) => sum + doc.size, 0)
  const storageLimit = 500 * 1024 * 1024 // 500MB
  const storagePercent = Math.round((storageUsed / storageLimit) * 100)

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {t('dashboard.welcome')}, {userProfile?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {isBusiness ? t('dashboard.businessDashboard') : t('dashboard.personalFinance')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-lg border border-border shadow-sm hover:shadow-md transition-all" asChild>
            <Link href="/dashboard/expenses">
              <Receipt className="mr-2 h-4 w-4" />
              {t('dashboard.addExpense')}
            </Link>
          </Button>
          {isBusiness && (
            <Button className="rounded-lg border border-border shadow-sm hover:shadow-md transition-all" asChild>
              <Link href="/dashboard/invoices">
                <Plus className="mr-2 h-4 w-4" />
                {t('dashboard.newInvoice')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg border border-border shadow-sm bg-accent text-accent-foreground">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm opacity-80 font-mono uppercase tracking-wider">{t('dashboard.stats.totalBalance')}</span>
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black truncate">{formatCurrency(totalBalance, currency)}</div>
            <div className="mt-2 flex items-center text-xs sm:text-sm">
              <ArrowUpRight className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              +12.5% {t('dashboard.stats.fromLastMonth')}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground font-mono uppercase tracking-wider">{t('dashboard.stats.monthlyIncome')}</span>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black truncate">{formatCurrency(monthlyIncome, currency)}</div>
            <div className="mt-2 flex items-center text-xs sm:text-sm text-accent">
              <ArrowUpRight className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              +8.2% {t('dashboard.stats.fromLastMonth')}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground font-mono uppercase tracking-wider">{t('dashboard.stats.monthlyExpenses')}</span>
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black truncate">{formatCurrency(monthlyExpenses, currency)}</div>
            <div className="mt-2 flex items-center text-xs sm:text-sm text-destructive">
              <ArrowDownRight className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              +4.5% {t('dashboard.stats.fromLastMonth')}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground font-mono uppercase tracking-wider">
                {isBusiness ? t('dashboard.stats.pendingInvoices') : t('dashboard.stats.savingsGoal')}
              </span>
              {isBusiness ? (
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              ) : (
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              )}
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black truncate">
              {isBusiness ? formatCurrency(pendingInvoicesTotal, currency) : "68%"}
            </div>
            <div className="mt-2 text-xs sm:text-sm text-muted-foreground font-mono">
              {isBusiness ? `${pendingInvoicesCount} invoices pending` : `${formatCurrency(6800, currency)} of ${formatCurrency(10000, currency)}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 rounded-lg border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border">
            <div>
              <CardTitle className="font-black">{t('dashboard.recentTransactions.title')}</CardTitle>
              <CardDescription className="font-mono text-xs">{t('dashboard.recentTransactions.description')}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="font-mono" asChild>
              <Link href="/dashboard/expenses">
                {t('dashboard.recentTransactions.viewAll')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="divide-y-2 divide-foreground min-w-[300px]">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors gap-2">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg border border-border ${
                      transaction.type === "income" ? "bg-accent" : "bg-secondary"
                    }`}>
                      {transaction.type === "income" ? (
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm sm:text-base truncate">{transaction.description}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black font-mono text-sm sm:text-base ${transaction.amount > 0 ? "text-accent" : ""}`}>
                      {transaction.amount > 0 ? "+" : ""}{formatCurrency(transaction.amount, currency)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-mono">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Pending Invoices or Book Entries */}
          {isBusiness ? (
            <Card className="rounded-lg border border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border">
                <div>
                  <CardTitle className="font-black">{t('dashboard.pendingInvoices.title')}</CardTitle>
                  <CardDescription className="font-mono text-xs">{t('dashboard.pendingInvoices.description')}</CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{invoice.clientName}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {invoice.invoiceNumber} · Due {new Date(invoice.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black font-mono">{formatCurrency(invoice.total, currency)}</p>
                          <span className={`text-xs font-mono uppercase px-2 py-0.5 border ${
                            invoice.status === "overdue" ? "border-destructive text-destructive bg-destructive/10" : "border-warning text-warning bg-warning/10"
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-4">
                  <Button variant="outline" className="w-full rounded-lg border border-border font-mono" asChild>
                    <Link href="/dashboard/invoices">
                      {t('dashboard.pendingInvoices.manage')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Recent Book Entries */}
          <Card className="rounded-lg border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border">
              <div>
                <CardTitle className="font-black">{t('dashboard.bookEntries.title')}</CardTitle>
                <CardDescription className="font-mono text-xs">{t('dashboard.bookEntries.description')}</CardDescription>
              </div>
              <BookOpen className="h-5 w-5" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentBookEntries.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-mono rounded border ${
                          entry.type === "income" ? "border-accent bg-accent/10 text-accent" : 
                          entry.type === "expense" ? "border-destructive bg-destructive/10 text-destructive" :
                          "border-foreground bg-muted"
                        }`}>
                          {entry.type === 'income' ? t('common.income') : entry.type === 'expense' ? t('common.expense') : entry.type.toUpperCase()}
                        </span>
                        <span className="font-bold truncate max-w-32">{entry.description}</span>
                      </div>
                      <span className="font-mono font-bold">{formatCurrency(entry.amount, currency)}</span>
                    </div>
                    {(entry.linkedInvoiceId || entry.linkedExpenseId) && (
                      <p className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-accent rounded-full"></span>
                        {t('common.linkedTo')} {entry.linkedInvoiceId ? "invoice" : "expense"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-4">
                <Button variant="outline" className="w-full rounded-lg border border-border font-mono" asChild>
                  <Link href="/dashboard/book">
                    {t('dashboard.bookEntries.openBook')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Storage Widget */}
          <Card className="rounded-lg border border-border shadow-sm bg-secondary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs uppercase tracking-wider">{t('dashboard.storage.title')}</span>
                <FolderOpen className="h-4 w-4" />
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-2xl font-black">{storagePercent}%</span>
                <span className="text-sm text-muted-foreground font-mono mb-1">of {formatBytes(storageLimit)}</span>
              </div>
              <div className="h-2 bg-background rounded-full border border-border overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-2">
                {documents.length} documents stored
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-lg border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-black">Quick Actions</CardTitle>
          <CardDescription className="font-mono text-xs">Common tasks at your fingertips</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-all" asChild>
              <Link href="/dashboard/expenses">
                <Receipt className="h-6 w-6" />
                <span className="font-bold">Add Expense</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-all" asChild>
              <Link href="/dashboard/book">
                <BookOpen className="h-6 w-6" />
                <span className="font-bold">Financial Book</span>
              </Link>
            </Button>
            {isBusiness && (
              <>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-all" asChild>
                  <Link href="/dashboard/invoices">
                    <FileText className="h-6 w-6" />
                    <span className="font-bold">Create Invoice</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-all" asChild>
                  <Link href="/dashboard/projects">
                    <Wallet className="h-6 w-6" />
                    <span className="font-bold">Projects</span>
                  </Link>
                </Button>
              </>
            )}
            {!isBusiness && (
              <>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-all" asChild>
                  <Link href="/dashboard/budget">
                    <PieChart className="h-6 w-6" />
                    <span className="font-bold">Budget</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-all" asChild>
                  <Link href="/dashboard/reports">
                    <TrendingUp className="h-6 w-6" />
                    <span className="font-bold">Reports</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
