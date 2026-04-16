"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDataStore, formatCurrency, formatDate, type Expense } from "@/lib/data-store"
import { AttachmentsField, AttachmentsBadge, type LocalAttachment } from "@/components/attachments-field"
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Car,
  Coffee,
  CreditCard,
  Download,
  Edit2,
  Film,
  Filter,
  Home,
  Lightbulb,
  Link2,
  MoreVertical,
  Paperclip,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  Utensils,
  Wifi,
} from "lucide-react"

const categories = [
  { name: "Office", icon: Home, color: "bg-purple-500" },
  { name: "Software", icon: Lightbulb, color: "bg-blue-500" },
  { name: "Travel", icon: Car, color: "bg-cyan-500" },
  { name: "Meals", icon: Utensils, color: "bg-orange-500" },
  { name: "Marketing", icon: TrendingUp, color: "bg-pink-500" },
  { name: "Internet", icon: Wifi, color: "bg-teal-500" },
  { name: "Entertainment", icon: Film, color: "bg-red-500" },
  { name: "Shopping", icon: ShoppingBag, color: "bg-green-500" },
  { name: "Income", icon: TrendingUp, color: "bg-accent" },
  { name: "Other", icon: CreditCard, color: "bg-gray-500" },
]

const paymentMethods = [
  "Credit Card",
  "Debit Card",
  "Cash",
  "Bank Transfer",
  "PayPal",
  "Other",
]

export default function ExpensesPage() {
  const { expenses, invoices, addExpense, updateExpense, deleteExpense, linkExpenseToInvoice, linkDocument, storage } = useDataStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [linkDialog, setLinkDialog] = useState<string | null>(null)
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Credit Card",
    notes: "",
    type: "expense" as "expense" | "income",
    tags: [] as string[],
  })
  const [attachments, setAttachments] = useState<LocalAttachment[]>([])

  const getCategoryIcon = (categoryName: string) => {
    const cat = categories.find(c => c.name === categoryName)
    return cat?.icon || CreditCard
  }

  const getCategoryColor = (categoryName: string) => {
    const cat = categories.find(c => c.name === categoryName)
    return cat?.color || "bg-gray-500"
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const stats = {
    totalExpenses: expenses.filter(e => e.type === "expense").reduce((sum, e) => sum + e.amount, 0),
    totalIncome: expenses.filter(e => e.type === "income").reduce((sum, e) => sum + e.amount, 0),
    thisMonth: expenses.filter(e => {
      const expenseDate = new Date(e.date)
      const now = new Date()
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
    }).reduce((sum, e) => e.type === "expense" ? sum + e.amount : sum, 0),
    recurring: expenses.filter(e => e.isRecurring).length,
  }

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category) return

    const expenseId = await addExpense({
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date,
      paymentMethod: newExpense.paymentMethod,
      notes: newExpense.notes,
      type: newExpense.type,
      tags: newExpense.tags,
    })

    // Link uploaded attachments to the new expense
    for (const att of attachments) {
      try {
        await linkDocument(att.id, "expense", expenseId)
      } catch {}
    }

    setNewExpense({
      description: "",
      amount: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "Credit Card",
      notes: "",
      type: "expense",
      tags: [],
    })
    setAttachments([])
    setDialogOpen(false)
  }

  const handleLinkToInvoice = (expenseId: string, invoiceId: string) => {
    linkExpenseToInvoice(expenseId, invoiceId)
    setLinkDialog(null)
  }

  const getLinkedInvoice = (invoiceId?: string) => {
    if (!invoiceId) return null
    return invoices.find(i => i.id === invoiceId)
  }

  const getLinkedDocument = (expense: Expense) => {
    if (expense.linkedDocuments.length === 0) return null
    return storage.documents.find(d => d.id === expense.linkedDocuments[0])
  }

  const handleExport = () => {
    const headers = "Date,Description,Category,Amount,Type,Payment Method,Notes"
    const rows = expenses.map(e => 
      `${e.date},"${e.description}",${e.category},${e.amount},${e.type},${e.paymentMethod},"${e.notes || ""}"`
    ).join("\n")
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "expenses.csv"
    a.click()
  }

  return (
    <div className="space-y-8 p-4 sm:p-8">
      {/* Header */}
      <div className="animate-fade-up flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your income and expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="rounded-lg border font-medium">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl border">
              <DialogHeader>
                <DialogTitle className="font-semibold">Add Transaction</DialogTitle>
                <DialogDescription>Record a new income or expense</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Button
                    variant={newExpense.type === "expense" ? "default" : "outline"}
                    className={`flex-1 rounded-lg border font-medium ${newExpense.type === "expense" ? "shadow-sm" : ""}`}
                    onClick={() => setNewExpense({ ...newExpense, type: "expense", category: "" })}
                  >
                    <ArrowDownRight className="mr-2 h-4 w-4" />
                    Expense
                  </Button>
                  <Button
                    variant={newExpense.type === "income" ? "default" : "outline"}
                    className={`flex-1 rounded-lg border font-medium ${newExpense.type === "income" ? "shadow-sm" : ""}`}
                    onClick={() => setNewExpense({ ...newExpense, type: "income", category: "Income" })}
                  >
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Income
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Description</Label>
                  <Input
                    className="rounded-lg border"
                    placeholder="What was this for?"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-medium">Amount</Label>
                    <Input
                      type="number"
                      className="rounded-lg border"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Date</Label>
                    <Input
                      type="date"
                      className="rounded-lg border"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    />
                  </div>
                </div>

                {newExpense.type === "expense" && (
                  <div className="space-y-2">
                    <Label className="font-medium">Category</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {categories.filter(c => c.name !== "Income").map((cat) => (
                        <button
                          key={cat.name}
                          onClick={() => setNewExpense({ ...newExpense, category: cat.name })}
                          className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                            newExpense.category === cat.name
                              ? "border-accent bg-accent/10 shadow-sm"
                              : "border-border hover:bg-muted"
                          }`}
                          title={cat.name}
                        >
                          <cat.icon className="h-5 w-5" />
                          <span className="text-[10px] font-medium truncate w-full text-center">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="font-medium">Payment Method</Label>
                  <Select
                    value={newExpense.paymentMethod}
                    onValueChange={(v) => setNewExpense({ ...newExpense, paymentMethod: v })}
                  >
                    <SelectTrigger className="rounded-lg border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border">
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">
                    Justification documents
                    <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <AttachmentsField
                    value={attachments}
                    onChange={setAttachments}
                    documentType={newExpense.type === "income" ? "invoice" : "receipt"}
                    linkedTo={{ type: "expense" }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg border font-medium">Cancel</Button>
                <Button onClick={handleAddExpense} className="shadow-sm font-semibold">Add Transaction</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Income</span>
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div className="mt-2 font-mono text-2xl font-semibold text-accent">
              +{formatCurrency(stats.totalIncome)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Expenses</span>
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div className="mt-2 font-mono text-2xl font-semibold">
              -{formatCurrency(stats.totalExpenses)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">This Month</span>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-2 font-mono text-2xl font-semibold">
              {formatCurrency(stats.thisMonth)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">In expenses</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Net Balance</span>
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className={`mt-2 font-mono text-2xl font-semibold ${stats.totalIncome - stats.totalExpenses >= 0 ? "text-accent" : "text-destructive"}`}>
              {formatCurrency(stats.totalIncome - stats.totalExpenses)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-xl border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-9 rounded-lg border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48 rounded-lg border">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="h-4 w-4" />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-semibold">Transactions</CardTitle>
          <CardDescription>
            {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="all">
            <div className="border-b border-border px-4 pt-4 overflow-x-auto">
              <TabsList className="bg-muted rounded-lg border border-border inline-flex w-auto">
                <TabsTrigger value="all" className="font-medium">All</TabsTrigger>
                <TabsTrigger value="expenses" className="font-medium">Expenses</TabsTrigger>
                <TabsTrigger value="income" className="font-medium">Income</TabsTrigger>
              </TabsList>
            </div>

            {["all", "expenses", "income"].map((tab) => (
              <TabsContent key={tab} value={tab} className="m-0">
                {filteredExpenses.filter(e => tab === "all" || (tab === "expenses" && e.type === "expense") || (tab === "income" && e.type === "income")).length > 0 ? (
                  <div className="divide-y-2 divide-border">
                    {filteredExpenses
                      .filter(e => tab === "all" || (tab === "expenses" && e.type === "expense") || (tab === "income" && e.type === "income"))
                      .map((expense) => {
                        const Icon = getCategoryIcon(expense.category)
                        const color = getCategoryColor(expense.category)
                        const linkedInvoice = getLinkedInvoice(expense.linkedInvoice)
                        const linkedDoc = getLinkedDocument(expense)
                        
                        return (
                          <div
                            key={expense.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors group gap-3"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                              <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center ${color}`}>
                                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold truncate">{expense.description}</p>
                                  {expense.isRecurring && (
                                    <Badge variant="secondary" className="border text-xs shrink-0">
                                      <RefreshCw className="mr-1 h-3 w-3" />
                                      {expense.recurringFrequency}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                                  <span>{expense.category}</span>
                                  <span>·</span>
                                  <span className="font-mono">{formatDate(expense.date)}</span>
                                  {linkedInvoice && (
                                    <>
                                      <span>·</span>
                                      <Badge variant="outline" className="text-xs border">
                                        <Link2 className="mr-1 h-3 w-3" />
                                        {linkedInvoice.number}
                                      </Badge>
                                    </>
                                  )}
                                  {linkedDoc && (
                                    <>
                                      <span>·</span>
                                      <Paperclip className="h-3 w-3" />
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="text-right sm:text-right">
                                <p className={`font-mono text-base sm:text-lg font-semibold ${expense.type === "income" ? "text-accent" : ""}`}>
                                  {expense.type === "income" ? "+" : "-"}{formatCurrency(expense.amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">{expense.paymentMethod}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="rounded-lg border border-transparent hover:border-border">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-lg border">
                                  <DropdownMenuItem onClick={() => setEditingExpense(expense)} className="font-medium">
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="font-medium">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Attach Receipt
                                  </DropdownMenuItem>
                                  {expense.type === "income" && !expense.linkedInvoice && (
                                    <DropdownMenuItem onClick={() => setLinkDialog(expense.id)} className="font-medium">
                                      <Link2 className="mr-2 h-4 w-4" />
                                      Link to Invoice
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive font-medium"
                                    onClick={() => deleteExpense(expense.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-muted">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold">No transactions found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchQuery || categoryFilter !== "all" ? "Try adjusting your filters" : "Add your first transaction"}
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Link to Invoice Dialog */}
      <Dialog open={!!linkDialog} onOpenChange={(open) => !open && setLinkDialog(null)}>
        <DialogContent className="rounded-xl border">
          <DialogHeader>
            <DialogTitle className="font-semibold">Link to Invoice</DialogTitle>
            <DialogDescription>Connect this income to an invoice for tracking</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2 py-4">
            {invoices.filter(i => i.status === "sent" || i.status === "paid").map((invoice) => (
              <button
                key={invoice.id}
                onClick={() => linkDialog && handleLinkToInvoice(linkDialog, invoice.id)}
                className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-accent" />
                  <div className="text-left">
                    <p className="font-semibold">{invoice.number}</p>
                    <p className="text-sm text-muted-foreground">{invoice.client}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold">{formatCurrency(invoice.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0))}</p>
                  <Badge className={invoice.status === "paid" ? "bg-accent text-accent-foreground" : "bg-chart-3 text-white"}>
                    {invoice.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog(null)} className="rounded-lg border font-medium">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="rounded-xl border">
          <DialogHeader>
            <DialogTitle className="font-semibold">Edit Transaction</DialogTitle>
            <DialogDescription>Update transaction details</DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="font-medium">Description</Label>
                <Input
                  className="rounded-lg border"
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-medium">Amount</Label>
                  <Input
                    type="number"
                    className="rounded-lg border"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Date</Label>
                  <Input
                    type="date"
                    className="rounded-lg border"
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Category</Label>
                <Select
                  value={editingExpense.category}
                  onValueChange={(v) => setEditingExpense({ ...editingExpense, category: v })}
                >
                  <SelectTrigger className="rounded-lg border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border">
                    {categories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExpense(null)} className="rounded-lg border font-medium">Cancel</Button>
            <Button 
              onClick={() => {
                if (editingExpense) {
                  updateExpense(editingExpense.id, editingExpense)
                  setEditingExpense(null)
                }
              }} 
              className="shadow-sm font-semibold"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
