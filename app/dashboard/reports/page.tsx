"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDataStore, formatCurrency } from "@/lib/data-store"
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

const monthlyData = [
  { month: "Jan", income: 8500, expenses: 6200 },
  { month: "Feb", income: 9200, expenses: 7100 },
  { month: "Mar", income: 8800, expenses: 6800 },
  { month: "Apr", income: 10500, expenses: 7500 },
  { month: "May", income: 9800, expenses: 7200 },
  { month: "Jun", income: 11200, expenses: 8100 },
]

const categoryBreakdown = [
  { name: "Food & Dining", amount: 1250, percentage: 25, color: "bg-accent" },
  { name: "Transportation", amount: 650, percentage: 13, color: "bg-secondary" },
  { name: "Housing", amount: 1500, percentage: 30, color: "bg-warning" },
  { name: "Utilities", amount: 380, percentage: 8, color: "bg-foreground" },
  { name: "Entertainment", amount: 420, percentage: 8, color: "bg-destructive" },
  { name: "Other", amount: 800, percentage: 16, color: "bg-muted" },
]

const topExpenses = [
  { description: "Rent Payment", category: "Housing", amount: 1500, date: "Apr 1" },
  { description: "Grocery Shopping", category: "Food & Dining", amount: 345, date: "Apr 8" },
  { description: "Electric Bill", category: "Utilities", amount: 180, date: "Apr 5" },
  { description: "Car Insurance", category: "Transportation", amount: 250, date: "Apr 3" },
  { description: "Dining Out", category: "Food & Dining", amount: 185, date: "Apr 12" },
]

export default function ReportsPage() {
  const { userProfile, transactions, invoices, expenses } = useDataStore()
  const currency = userProfile?.currency || "EUR"
  const [period, setPeriod] = useState("6months")
  const isBusiness = userProfile?.type !== "individual"

  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0)
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0)
  const netSavings = totalIncome - totalExpenses
  const savingsRate = Math.round((netSavings / totalIncome) * 100)

  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)))

  const exportReport = (format: string) => {
    const data = {
      period,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      monthlyData,
      categoryBreakdown
    }
    
    if (format === "csv") {
      const csv = [
        ["Month", "Income", "Expenses", "Net"].join(","),
        ...monthlyData.map(m => [m.month, m.income, m.expenses, m.income - m.expenses].join(","))
      ].join("\n")
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "financial-report.csv"
      a.click()
    } else {
      // JSON export
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "financial-report.json"
      a.click()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reports</h1>
          <p className="text-muted-foreground font-mono text-sm">Analyze your financial performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 rounded-lg border border-border">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border border-border">
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportReport("csv")} className="rounded-lg border border-border shadow-sm hover:-translate-y-0.5 transition-all">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground text-xs font-medium">Total {isBusiness ? "Revenue" : "Income"}</span>
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{formatCurrency(totalIncome, currency)}</div>
            <div className="mt-2 flex items-center text-sm text-accent font-mono">
              <ArrowUp className="mr-1 h-4 w-4" />
              +12.5% vs previous
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground text-xs font-medium">Total Expenses</span>
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{formatCurrency(totalExpenses, currency)}</div>
            <div className="mt-2 flex items-center text-sm text-destructive font-mono">
              <ArrowUp className="mr-1 h-4 w-4" />
              +8.3% vs previous
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-border shadow-sm bg-accent text-accent-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-80 text-xs font-medium">Net {isBusiness ? "Profit" : "Savings"}</span>
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className={`mt-2 text-2xl font-semibold ${netSavings < 0 ? "text-destructive" : ""}`}>
              {formatCurrency(netSavings, currency)}
            </div>
            <div className="mt-2 flex items-center text-sm font-mono">
              <ArrowUp className="mr-1 h-4 w-4" />
              +18.2% vs previous
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground text-xs font-medium">{isBusiness ? "Profit" : "Savings"} Rate</span>
              <PieChart className="h-5 w-5" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{savingsRate}%</div>
            <p className="mt-2 text-sm text-muted-foreground font-mono">
              {isBusiness ? "Revenue to profit" : "Income to savings"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="rounded-lg border border-border bg-background p-1">
          <TabsTrigger value="overview" className="font-mono data-[state=active]:bg-foreground data-[state=active]:text-background">Overview</TabsTrigger>
          <TabsTrigger value="income" className="font-mono data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">{isBusiness ? "Revenue" : "Income"}</TabsTrigger>
          <TabsTrigger value="expenses" className="font-mono data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Expenses</TabsTrigger>
          <TabsTrigger value="trends" className="font-mono data-[state=active]:bg-foreground data-[state=active]:text-background">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Monthly Chart */}
            <Card className="lg:col-span-2 rounded-lg border border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="font-semibold">Income vs Expenses</CardTitle>
                <CardDescription className="font-mono text-xs">Monthly comparison over the selected period</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="w-12 font-semibold font-mono">{data.month}</span>
                        <div className="flex gap-4 text-muted-foreground font-mono text-xs">
                          <span className="text-accent">{formatCurrency(data.income, currency)}</span>
                          <span className="text-destructive">{formatCurrency(data.expenses, currency)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="h-4 bg-accent rounded-lg border border-border transition-all"
                          style={{ width: `${(data.income / maxValue) * 100}%` }}
                        />
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="h-4 bg-destructive/70 rounded-lg border border-border transition-all"
                          style={{ width: `${(data.expenses / maxValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-lg border border-border bg-accent" />
                    <span className="text-muted-foreground font-mono">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-lg border border-border bg-destructive/70" />
                    <span className="text-muted-foreground font-mono">Expenses</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="rounded-lg border border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="font-semibold">Expense Breakdown</CardTitle>
                <CardDescription className="font-mono text-xs">By category</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold">{cat.name}</span>
                        <span className="text-muted-foreground font-mono">{cat.percentage}%</span>
                      </div>
                      <div className="h-3 rounded-lg border border-border bg-muted">
                        <div
                          className={`h-full transition-all ${cat.color}`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <p className="text-right text-xs text-muted-foreground font-mono">
                        {formatCurrency(cat.amount, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Expenses */}
          <Card className="rounded-lg border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="font-semibold">Top Expenses</CardTitle>
              <CardDescription className="font-mono text-xs">Largest transactions this period</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {topExpenses.map((expense, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary font-semibold font-mono">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-bold">{expense.description}</p>
                        <p className="text-sm text-muted-foreground font-mono">{expense.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold font-mono">{formatCurrency(expense.amount, currency)}</p>
                      <p className="text-sm text-muted-foreground font-mono">{expense.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <Card className="rounded-lg border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="font-semibold">{isBusiness ? "Revenue" : "Income"} Trend</CardTitle>
              <CardDescription className="font-mono text-xs">Monthly {isBusiness ? "revenue" : "income"} over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex h-64 items-end gap-2">
                {monthlyData.map((data) => (
                  <div key={data.month} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full bg-accent rounded-lg border border-border transition-all hover:bg-accent/80"
                      style={{ height: `${(data.income / maxValue) * 200}px` }}
                    />
                    <span className="text-xs text-muted-foreground font-mono font-bold">{data.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card className="rounded-lg border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="font-semibold">Expense Trend</CardTitle>
              <CardDescription className="font-mono text-xs">Monthly expenses over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex h-64 items-end gap-2">
                {monthlyData.map((data) => (
                  <div key={data.month} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full bg-destructive/70 rounded-lg border border-border transition-all hover:bg-destructive"
                      style={{ height: `${(data.expenses / maxValue) * 200}px` }}
                    />
                    <span className="text-xs text-muted-foreground font-mono font-bold">{data.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-lg border border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="font-semibold">Key Insights</CardTitle>
                <CardDescription className="font-mono text-xs">AI-powered analysis of your finances</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-accent bg-accent/10 p-4">
                  <ArrowUp className="mt-0.5 h-5 w-5 text-accent" />
                  <div>
                    <p className="font-semibold">Income Growing</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      Your income has increased by 32% over the last 6 months.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-warning bg-warning/10 p-4">
                  <TrendingDown className="mt-0.5 h-5 w-5 text-warning" />
                  <div>
                    <p className="font-semibold">Food Expenses High</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      Food & Dining represents 25% of your expenses. Consider setting a budget.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-accent bg-accent/10 p-4">
                  <BarChart3 className="mt-0.5 h-5 w-5 text-accent" />
                  <div>
                    <p className="font-semibold">Healthy Savings Rate</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      You&apos;re saving {savingsRate}% of your income, above the recommended 20%.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="font-semibold">Projections</CardTitle>
                <CardDescription className="font-mono text-xs">Forecast based on current trends</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="rounded-lg border border-border p-4 bg-accent/10">
                  <p className="text-sm text-muted-foreground text-xs font-medium">Projected Year-End {isBusiness ? "Profit" : "Savings"}</p>
                  <p className="mt-1 text-2xl font-semibold text-accent">
                    {formatCurrency(netSavings * 2, currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground text-xs font-medium">Average Monthly {isBusiness ? "Revenue" : "Income"}</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(totalIncome / monthlyData.length, currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground text-xs font-medium">Average Monthly Expenses</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(totalExpenses / monthlyData.length, currency)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card className="rounded-lg border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-semibold">Export Reports</CardTitle>
          <CardDescription className="font-mono text-xs">Download your financial data in various formats</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4 rounded-lg border border-border shadow-sm hover:-translate-y-0.5 transition-all"
              onClick={() => exportReport("pdf")}
            >
              <FileText className="h-6 w-6" />
              <span className="font-semibold">PDF Report</span>
              <span className="text-xs text-muted-foreground font-mono">Full financial summary</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4 rounded-lg border border-border shadow-sm hover:-translate-y-0.5 transition-all"
              onClick={() => exportReport("csv")}
            >
              <FileSpreadsheet className="h-6 w-6" />
              <span className="font-semibold">Excel Export</span>
              <span className="text-xs text-muted-foreground font-mono">Raw data for analysis</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4 rounded-lg border border-border shadow-sm hover:-translate-y-0.5 transition-all"
              onClick={() => exportReport("csv")}
            >
              <BarChart3 className="h-6 w-6" />
              <span className="font-semibold">CSV Export</span>
              <span className="text-xs text-muted-foreground font-mono">Transaction history</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
