"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { useDataStore, formatCurrency, formatDate, type Invoice, type InvoiceItem } from "@/lib/data-store"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  Link2,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Trash2,
  X,
  Printer,
  Upload,
  Sparkles,
} from "lucide-react"

export default function InvoicesPage() {
  const { invoices, addInvoice, updateInvoice, deleteInvoice, expenses } = useDataStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [newInvoice, setNewInvoice] = useState({
    client: "",
    clientEmail: "",
    clientAddress: "",
    dueDate: "",
    notes: "",
    taxRate: 20,
    currency: "EUR",
    items: [{ id: "1", description: "", quantity: 1, unitPrice: 0 }] as InvoiceItem[],
  })

  const calculateSubtotal = (items: InvoiceItem[]) => 
    items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  
  const calculateTax = (items: InvoiceItem[], taxRate: number) =>
    calculateSubtotal(items) * (taxRate / 100)
  
  const calculateTotal = (items: InvoiceItem[], taxRate = 0) =>
    calculateSubtotal(items) + calculateTax(items, taxRate)

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "paid": return "bg-accent text-accent-foreground"
      case "sent": return "bg-chart-3 text-white"
      case "overdue": return "bg-destructive text-destructive-foreground"
      case "draft": return "bg-muted text-muted-foreground rounded-lg border border-border"
      case "cancelled": return "bg-muted text-muted-foreground line-through"
    }
  }

  const getStatusIcon = (status: Invoice["status"]) => {
    switch (status) {
      case "paid": return <CheckCircle2 className="h-4 w-4" />
      case "sent": return <Clock className="h-4 w-4" />
      case "overdue": return <AlertCircle className="h-4 w-4" />
      case "draft": return <FileText className="h-4 w-4" />
      case "cancelled": return <X className="h-4 w-4" />
    }
  }

  const filteredInvoices = invoices.filter(inv => 
    inv.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: invoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.taxRate), 0),
    paid: invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + calculateTotal(inv.items, inv.taxRate), 0),
    pending: invoices.filter(inv => inv.status === "sent").reduce((sum, inv) => sum + calculateTotal(inv.items, inv.taxRate), 0),
    overdue: invoices.filter(inv => inv.status === "overdue").reduce((sum, inv) => sum + calculateTotal(inv.items, inv.taxRate), 0),
  }

  const handleAddItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0 }]
    }))
  }

  const handleRemoveItem = (itemId: string) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleCreateInvoice = () => {
    addInvoice({
      client: newInvoice.client,
      clientEmail: newInvoice.clientEmail,
      clientAddress: newInvoice.clientAddress,
      items: newInvoice.items.filter(item => item.description),
      status: "draft",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: newInvoice.dueDate,
      notes: newInvoice.notes,
      taxRate: newInvoice.taxRate,
      currency: newInvoice.currency,
    })
    setNewInvoice({
      client: "",
      clientEmail: "",
      clientAddress: "",
      dueDate: "",
      notes: "",
      taxRate: 20,
      currency: "EUR",
      items: [{ id: "1", description: "", quantity: 1, unitPrice: 0 }],
    })
    setDialogOpen(false)
  }

  const handleExportPDF = (invoice: Invoice) => {
    // Create a simple text representation for demo
    const content = `
INVOICE ${invoice.number}
========================
Client: ${invoice.client}
Email: ${invoice.clientEmail}
${invoice.clientAddress ? `Address: ${invoice.clientAddress}` : ""}

Issue Date: ${formatDate(invoice.issueDate)}
Due Date: ${formatDate(invoice.dueDate)}

ITEMS
-----
${invoice.items.map(item => `${item.description}\t${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.quantity * item.unitPrice)}`).join("\n")}

Subtotal: ${formatCurrency(calculateSubtotal(invoice.items))}
Tax (${invoice.taxRate || 0}%): ${formatCurrency(calculateTax(invoice.items, invoice.taxRate || 0))}
TOTAL: ${formatCurrency(calculateTotal(invoice.items, invoice.taxRate))}

${invoice.notes ? `Notes: ${invoice.notes}` : ""}
    `.trim()
    
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${invoice.number}.txt`
    a.click()
  }

  // Get linked expense for an invoice
  const getLinkedExpense = (invoiceId: string) => {
    return expenses.find(e => e.linkedInvoice === invoiceId)
  }

  return (
    <div className="space-y-8 p-4 sm:p-8">
      {/* Header */}
      <div className="animate-fade-up flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Invoices</h1>
          <p className="text-muted-foreground">Create, send, and track your invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-lg border font-medium">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-xl border">
              <DialogHeader>
                <DialogTitle className="font-semibold">Create Invoice</DialogTitle>
                <DialogDescription>Fill in the details to create a new invoice</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] space-y-6 overflow-y-auto py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-medium">Client Name</Label>
                    <Input
                      className="rounded-lg border"
                      placeholder="Company or person name"
                      value={newInvoice.client}
                      onChange={(e) => setNewInvoice({ ...newInvoice, client: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Client Email</Label>
                    <Input
                      type="email"
                      className="rounded-lg border"
                      placeholder="billing@company.com"
                      value={newInvoice.clientEmail}
                      onChange={(e) => setNewInvoice({ ...newInvoice, clientEmail: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="font-medium">Client Address</Label>
                  <Input
                    className="rounded-lg border"
                    placeholder="Full address"
                    value={newInvoice.clientAddress}
                    onChange={(e) => setNewInvoice({ ...newInvoice, clientAddress: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="font-medium">Due Date</Label>
                    <Input
                      type="date"
                      className="rounded-lg border"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Tax Rate (%)</Label>
                    <Input
                      type="number"
                      className="rounded-lg border"
                      value={newInvoice.taxRate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, taxRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Currency</Label>
                    <Select
                      value={newInvoice.currency}
                      onValueChange={(v) => setNewInvoice({ ...newInvoice, currency: v })}
                    >
                      <SelectTrigger className="rounded-lg border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border">
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        <SelectItem value="USD">USD (Dollar)</SelectItem>
                        <SelectItem value="GBP">GBP (Pound)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Line Items</Label>
                    <Button variant="outline" size="sm" onClick={handleAddItem} className="rounded-lg border font-medium">
                      <Plus className="mr-1 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {newInvoice.items.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <Input
                            className="rounded-lg border"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                          />
                        </div>
                        <div className="w-20 space-y-2">
                          <Input
                            type="number"
                            className="rounded-lg border"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="w-28 space-y-2">
                          <Input
                            type="number"
                            className="rounded-lg border"
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="w-28 flex items-center justify-end font-mono font-semibold">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </div>
                        {newInvoice.items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="mt-0 rounded-lg border border-transparent hover:border-border"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono font-medium">{formatCurrency(calculateSubtotal(newInvoice.items))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({newInvoice.taxRate}%)</span>
                      <span className="font-mono font-medium">{formatCurrency(calculateTax(newInvoice.items, newInvoice.taxRate))}</span>
                    </div>
                    <div className="flex justify-between text-lg border-t border-border pt-2">
                      <span className="font-semibold">Total</span>
                      <span className="font-mono font-semibold text-accent">
                        {formatCurrency(calculateTotal(newInvoice.items, newInvoice.taxRate))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Notes (optional)</Label>
                  <Textarea
                    className="rounded-lg border"
                    placeholder="Payment terms, thank you message, etc."
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg border font-medium">Cancel</Button>
                <Button onClick={handleCreateInvoice} className="shadow-sm font-semibold">Create Invoice</Button>
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
              <span className="text-sm font-medium text-muted-foreground">Total Invoiced</span>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-2 font-mono text-2xl font-semibold">{formatCurrency(stats.total)}</div>
            <p className="mt-1 text-sm text-muted-foreground">{invoices.length} invoices</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Paid</span>
              <CheckCircle2 className="h-5 w-5 text-accent" />
            </div>
            <div className="mt-2 font-mono text-2xl font-semibold text-accent">{formatCurrency(stats.paid)}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {invoices.filter(inv => inv.status === "paid").length} invoices
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Pending</span>
              <Clock className="h-5 w-5 text-chart-3" />
            </div>
            <div className="mt-2 font-mono text-2xl font-semibold">{formatCurrency(stats.pending)}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {invoices.filter(inv => inv.status === "sent").length} invoices
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Overdue</span>
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="mt-2 font-mono text-2xl font-semibold text-destructive">{formatCurrency(stats.overdue)}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {invoices.filter(inv => inv.status === "overdue").length} invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-semibold">All Invoices</CardTitle>
              <CardDescription>Manage and track all your invoices</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                className="pl-9 rounded-lg border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="all">
            <div className="border-b border-border px-4 pt-4 overflow-x-auto">
              <TabsList className="bg-muted rounded-lg border border-border inline-flex w-auto">
                <TabsTrigger value="all" className="font-medium">All</TabsTrigger>
                <TabsTrigger value="draft" className="font-medium">Draft</TabsTrigger>
                <TabsTrigger value="sent" className="font-medium">Sent</TabsTrigger>
                <TabsTrigger value="paid" className="font-medium">Paid</TabsTrigger>
                <TabsTrigger value="overdue" className="font-medium">Overdue</TabsTrigger>
              </TabsList>
            </div>

            {["all", "draft", "sent", "paid", "overdue"].map((tab) => (
              <TabsContent key={tab} value={tab} className="m-0">
                {filteredInvoices.filter(inv => tab === "all" || inv.status === tab).length > 0 ? (
                  <div className="divide-y-2 divide-border">
                    {filteredInvoices
                      .filter(inv => tab === "all" || inv.status === tab)
                      .map((invoice) => {
                        const linkedExpense = getLinkedExpense(invoice.id)
                        return (
                          <div
                            key={invoice.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-secondary">
                                <FileText className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{invoice.number}</p>
                                  {linkedExpense && (
                                    <Badge variant="secondary" className="border text-xs">
                                      <Link2 className="mr-1 h-3 w-3" />
                                      Paid
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{invoice.client}</p>
                                <p className="text-xs text-muted-foreground">{invoice.clientEmail}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                              <div className="text-right">
                                <p className="font-mono text-lg font-semibold">
                                  {formatCurrency(calculateTotal(invoice.items, invoice.taxRate))}
                                </p>
                                <p className="text-xs text-muted-foreground">Due {formatDate(invoice.dueDate)}</p>
                              </div>
                              <Badge className={`${getStatusColor(invoice.status)} font-medium`}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(invoice.status)}
                                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                </span>
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="rounded-lg border border-transparent hover:border-border">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-lg border">
                                  <DropdownMenuItem onClick={() => setViewingInvoice(invoice)} className="font-medium">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="font-medium">
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExportPDF(invoice)} className="font-medium">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="font-medium">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print
                                  </DropdownMenuItem>
                                  {invoice.status === "draft" && (
                                    <DropdownMenuItem onClick={() => updateInvoice(invoice.id, { status: "sent" })} className="font-medium">
                                      <Send className="mr-2 h-4 w-4" />
                                      Send Invoice
                                    </DropdownMenuItem>
                                  )}
                                  {invoice.status === "sent" && (
                                    <DropdownMenuItem onClick={() => updateInvoice(invoice.id, { status: "paid", paidDate: new Date().toISOString().split("T")[0] })} className="font-medium">
                                      <Check className="mr-2 h-4 w-4" />
                                      Mark as Paid
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive font-medium"
                                    onClick={() => deleteInvoice(invoice.id)}
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
                    <h3 className="font-semibold">No invoices found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchQuery ? "Try adjusting your search" : "Create your first invoice to get started"}
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewingInvoice} onOpenChange={(open) => !open && setViewingInvoice(null)}>
        <DialogContent className="max-w-2xl rounded-xl border">
          {viewingInvoice && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="font-semibold text-2xl">{viewingInvoice.number}</DialogTitle>
                    <DialogDescription>Invoice for {viewingInvoice.client}</DialogDescription>
                  </div>
                  <Badge className={`${getStatusColor(viewingInvoice.status)} font-medium`}>
                    {getStatusIcon(viewingInvoice.status)}
                    <span className="ml-1">{viewingInvoice.status.charAt(0).toUpperCase() + viewingInvoice.status.slice(1)}</span>
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Bill To</p>
                    <p className="font-semibold">{viewingInvoice.client}</p>
                    <p className="text-sm text-muted-foreground">{viewingInvoice.clientEmail}</p>
                    {viewingInvoice.clientAddress && (
                      <p className="text-sm text-muted-foreground mt-1">{viewingInvoice.clientAddress}</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Issue Date</span>
                        <span className="font-mono font-medium">{formatDate(viewingInvoice.issueDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date</span>
                        <span className="font-mono font-medium">{formatDate(viewingInvoice.dueDate)}</span>
                      </div>
                      {viewingInvoice.paidDate && (
                        <div className="flex justify-between text-accent">
                          <span>Paid Date</span>
                          <span className="font-mono font-medium">{formatDate(viewingInvoice.paidDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted">
                        <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Qty</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Price</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingInvoice.items.map((item) => (
                        <tr key={item.id} className="border-b border-border">
                          <td className="px-4 py-3">{item.description}</td>
                          <td className="px-4 py-3 text-right font-mono">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-right font-mono font-medium">{formatCurrency(item.quantity * item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-b border-border">
                        <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">Subtotal</td>
                        <td className="px-4 py-2 text-right font-mono font-medium">{formatCurrency(calculateSubtotal(viewingInvoice.items))}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">Tax ({viewingInvoice.taxRate || 0}%)</td>
                        <td className="px-4 py-2 text-right font-mono font-medium">{formatCurrency(calculateTax(viewingInvoice.items, viewingInvoice.taxRate || 0))}</td>
                      </tr>
                      <tr className="bg-secondary">
                        <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total</td>
                        <td className="px-4 py-3 text-right font-mono text-xl font-semibold text-accent">{formatCurrency(calculateTotal(viewingInvoice.items, viewingInvoice.taxRate))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {viewingInvoice.notes && (
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
                    <p className="text-sm">{viewingInvoice.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => handleExportPDF(viewingInvoice)} className="rounded-lg border font-medium">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                {viewingInvoice.status === "draft" && (
                  <Button onClick={() => { updateInvoice(viewingInvoice.id, { status: "sent" }); setViewingInvoice(null) }} className="shadow-sm font-semibold">
                    <Send className="mr-2 h-4 w-4" />
                    Send Invoice
                  </Button>
                )}
                {viewingInvoice.status === "sent" && (
                  <Button onClick={() => { updateInvoice(viewingInvoice.id, { status: "paid", paidDate: new Date().toISOString().split("T")[0] }); setViewingInvoice(null) }} className="shadow-sm font-semibold">
                    <Check className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
