"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Label } from "@/components/ui/label"
import { useDataStore, formatCurrency, formatDate, type BookSheet, type BookColumn, type BookEntry } from "@/lib/data-store"
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Copy,
  Download,
  Edit2,
  FileSpreadsheet,
  Filter,
  Link2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  FileText,
  Receipt,
  Paperclip,
  TrendingUp,
  PieChart,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react"

const columnTypes = [
  { value: "text", label: "Text", icon: "Aa" },
  { value: "number", label: "Number", icon: "#" },
  { value: "currency", label: "Currency", icon: "$" },
  { value: "date", label: "Date", icon: "D" },
  { value: "select", label: "Select", icon: "▼" },
  { value: "checkbox", label: "Checkbox", icon: "✓" },
  { value: "link", label: "Link", icon: "🔗" },
]

const sheetIcons = [
  { id: "trending-up", icon: TrendingUp, label: "Income" },
  { id: "receipt", icon: Receipt, label: "Expenses" },
  { id: "pie-chart", icon: PieChart, label: "Budget" },
  { id: "file-text", icon: FileText, label: "Invoices" },
  { id: "file-spreadsheet", icon: FileSpreadsheet, label: "General" },
]

const sheetColors = [
  { id: "green", color: "#22c55e" },
  { id: "blue", color: "#3b82f6" },
  { id: "red", color: "#ef4444" },
  { id: "amber", color: "#f59e0b" },
  { id: "pink", color: "#ec4899" },
  { id: "purple", color: "#8b5cf6" },
]

export default function BookPage() {
  const { 
    sheets, addSheet, updateSheet, deleteSheet, 
    addBookEntry, updateBookEntry, deleteBookEntry,
    invoices, expenses, storage,
    exportData 
  } = useDataStore()
  
  const [activeSheetId, setActiveSheetId] = useState(sheets[0]?.id || "")
  const [editingCell, setEditingCell] = useState<{ entryId: string; colId: string } | null>(null)
  const [newSheetDialog, setNewSheetDialog] = useState(false)
  const [newColumnDialog, setNewColumnDialog] = useState(false)
  const [linkDialog, setLinkDialog] = useState<{ entryId: string; colId: string; type: "invoice" | "expense" | "document" } | null>(null)
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: "asc" | "desc" } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newSheet, setNewSheet] = useState({ name: "", icon: "file-spreadsheet", color: "#22c55e" })
  const [newColumn, setNewColumn] = useState({ name: "", type: "text" as BookColumn["type"], options: "" })

  const activeSheet = useMemo(() => sheets.find(s => s.id === activeSheetId), [sheets, activeSheetId])

  const handleCellChange = (entryId: string, colId: string, value: string | number | boolean) => {
    if (!activeSheet) return
    const entry = activeSheet.entries.find(e => e.id === entryId)
    if (entry) {
      updateBookEntry(activeSheet.id, entryId, {
        cells: { ...entry.cells, [colId]: value }
      })
    }
    setEditingCell(null)
  }

  const handleSort = (colId: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig?.column === colId && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ column: colId, direction })
  }

  const getSortedEntries = () => {
    if (!activeSheet) return []
    let entries = [...activeSheet.entries]
    
    if (searchQuery) {
      entries = entries.filter(entry => 
        Object.values(entry.cells).some(cell => 
          String(cell).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }
    
    if (sortConfig) {
      entries.sort((a, b) => {
        const aVal = a.cells[sortConfig.column]
        const bVal = b.cells[sortConfig.column]
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    
    return entries
  }

  const handleAddRow = () => {
    if (!activeSheet) return
    const newEntry: Omit<BookEntry, "id" | "createdAt" | "updatedAt"> = {
      cells: activeSheet.columns.reduce((acc, col) => {
        if (col.type === "number" || col.type === "currency") acc[col.id] = 0
        else if (col.type === "checkbox") acc[col.id] = false
        else acc[col.id] = ""
        return acc
      }, {} as Record<string, string | number | boolean>),
      linkedDocuments: [],
      linkedExpenses: [],
      linkedInvoices: [],
    }
    addBookEntry(activeSheet.id, newEntry)
  }

  const handleAddColumn = () => {
    if (!newColumn.name || !activeSheet) return
    const column: BookColumn = {
      id: newColumn.name.toLowerCase().replace(/\s+/g, "_"),
      name: newColumn.name,
      type: newColumn.type,
      width: 140,
      options: newColumn.type === "select" ? newColumn.options.split(",").map(o => o.trim()) : undefined,
      linkedType: newColumn.type === "link" ? "document" : undefined,
    }
    updateSheet(activeSheet.id, {
      columns: [...activeSheet.columns, column],
    })
    // Add the new column to all existing entries
    activeSheet.entries.forEach(entry => {
      const defaultValue = column.type === "number" || column.type === "currency" ? 0 : column.type === "checkbox" ? false : ""
      updateBookEntry(activeSheet.id, entry.id, {
        cells: { ...entry.cells, [column.id]: defaultValue }
      })
    })
    setNewColumn({ name: "", type: "text", options: "" })
    setNewColumnDialog(false)
  }

  const handleCreateSheet = () => {
    if (!newSheet.name) return
    addSheet({
      name: newSheet.name,
      icon: newSheet.icon,
      color: newSheet.color,
      columns: [
        { id: "col1", name: "Name", type: "text", width: 200 },
        { id: "col2", name: "Amount", type: "currency", width: 120 },
        { id: "col3", name: "Date", type: "date", width: 120 },
      ],
      entries: [],
    })
    setNewSheet({ name: "", icon: "file-spreadsheet", color: "#22c55e" })
    setNewSheetDialog(false)
  }

  const handleLinkItem = (itemId: string) => {
    if (!linkDialog || !activeSheet) return
    const entry = activeSheet.entries.find(e => e.id === linkDialog.entryId)
    if (!entry) return
    
    // Update the cell with the linked item ID
    updateBookEntry(activeSheet.id, linkDialog.entryId, {
      cells: { ...entry.cells, [linkDialog.colId]: itemId },
      linkedInvoices: linkDialog.type === "invoice" ? [...entry.linkedInvoices, itemId] : entry.linkedInvoices,
      linkedExpenses: linkDialog.type === "expense" ? [...entry.linkedExpenses, itemId] : entry.linkedExpenses,
      linkedDocuments: linkDialog.type === "document" ? [...entry.linkedDocuments, itemId] : entry.linkedDocuments,
    })
    setLinkDialog(null)
  }

  const handleExport = (format: "json" | "csv") => {
    if (!activeSheet) return
    if (format === "json") {
      const data = exportData("book")
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${activeSheet.name.toLowerCase().replace(/\s+/g, "-")}.json`
      a.click()
    } else {
      // CSV export
      const headers = activeSheet.columns.map(c => c.name).join(",")
      const rows = activeSheet.entries.map(entry => 
        activeSheet.columns.map(col => {
          const val = entry.cells[col.id]
          return typeof val === "string" && val.includes(",") ? `"${val}"` : val
        }).join(",")
      ).join("\n")
      const csv = `${headers}\n${rows}`
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${activeSheet.name.toLowerCase().replace(/\s+/g, "-")}.csv`
      a.click()
    }
  }

  const getColumnTotal = (colId: string) => {
    if (!activeSheet) return null
    const column = activeSheet.columns.find(c => c.id === colId)
    if (column?.type !== "currency" && column?.type !== "number") return null
    
    return activeSheet.entries.reduce((sum, entry) => {
      const value = entry.cells[colId]
      return sum + (typeof value === "number" ? value : parseFloat(String(value)) || 0)
    }, 0)
  }

  const getLinkedItemDisplay = (colId: string, value: string | number | boolean, linkedType?: string) => {
    if (!value || linkedType !== "invoice" && linkedType !== "expense" && linkedType !== "document") {
      return String(value)
    }
    
    if (linkedType === "invoice") {
      const invoice = invoices.find(i => i.id === value)
      return invoice ? invoice.number : "-"
    }
    if (linkedType === "expense") {
      const expense = expenses.find(e => e.id === value)
      return expense ? expense.description : "-"
    }
    if (linkedType === "document") {
      const doc = storage.documents.find(d => d.id === value)
      return doc ? doc.name : "-"
    }
    return String(value)
  }

  const SheetIcon = sheetIcons.find(i => i.id === activeSheet?.icon)?.icon || FileSpreadsheet

  return (
    <div className="space-y-8 p-4 sm:p-8">
      {/* Header */}
      <div className="animate-fade-up flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Financial Book</h1>
          <p className="text-muted-foreground">Smart spreadsheets connected to your invoices and expenses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-lg border font-medium">
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-lg border">
              <DropdownMenuItem onClick={() => handleExport("csv")} className="font-medium">
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")} className="font-medium">
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="rounded-lg border font-medium">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Dialog open={newSheetDialog} onOpenChange={setNewSheetDialog}>
            <DialogTrigger asChild>
              <Button className="shadow-sm font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                New Sheet
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl border">
              <DialogHeader>
                <DialogTitle className="font-semibold">Create New Sheet</DialogTitle>
                <DialogDescription>Add a new spreadsheet to your book</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="font-medium">Sheet Name</Label>
                  <Input
                    className="rounded-lg border"
                    placeholder="e.g., Q3 Budget Report"
                    value={newSheet.name}
                    onChange={(e) => setNewSheet({ ...newSheet, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Icon</Label>
                  <div className="flex gap-2">
                    {sheetIcons.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setNewSheet({ ...newSheet, icon: item.id })}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
                          newSheet.icon === item.id ? "border-accent bg-accent/10 shadow-sm" : "border-border hover:bg-muted"
                        }`}
                        title={item.label}
                      >
                        <item.icon className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Color</Label>
                  <div className="flex gap-2">
                    {sheetColors.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setNewSheet({ ...newSheet, color: item.color })}
                        className={`h-8 w-8 rounded-lg border transition-all ${
                          newSheet.color === item.color ? "border-foreground scale-110" : "border-border"
                        }`}
                        style={{ backgroundColor: item.color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewSheetDialog(false)} className="rounded-lg border font-medium">Cancel</Button>
                <Button onClick={handleCreateSheet} className="shadow-sm font-semibold">Create Sheet</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {sheets.map((sheet) => {
          const IconComponent = sheetIcons.find(i => i.id === sheet.icon)?.icon || FileSpreadsheet
          return (
            <div key={sheet.id} className="relative flex-shrink-0">
              <Button
                variant={activeSheetId === sheet.id ? "default" : "outline"}
                size="sm"
                className={`pr-8 rounded-lg border font-medium ${activeSheetId === sheet.id ? "shadow-sm" : ""}`}
                onClick={() => setActiveSheetId(sheet.id)}
              >
                <IconComponent className="mr-2 h-4 w-4" style={{ color: activeSheetId === sheet.id ? undefined : sheet.color }} />
                {sheet.name}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-8 rounded-l-none border-l-0"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-lg border">
                  <DropdownMenuItem className="font-medium">
                    <Edit2 className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem className="font-medium">
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive font-medium"
                    onClick={() => {
                      if (sheets.length > 1) {
                        deleteSheet(sheet.id)
                        if (activeSheetId === sheet.id) {
                          setActiveSheetId(sheets.find(s => s.id !== sheet.id)?.id || "")
                        }
                      }
                    }}
                    disabled={sheets.length <= 1}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>

      {/* Spreadsheet */}
      {activeSheet && (
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-4 border-b border-border">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border"
                  style={{ backgroundColor: activeSheet.color }}
                >
                  <SheetIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="font-semibold">{activeSheet.name}</CardTitle>
                  <CardDescription>
                    {activeSheet.entries.length} entries · {activeSheet.columns.length} columns
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="w-40 pl-9 rounded-lg border"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Dialog open={newColumnDialog} onOpenChange={setNewColumnDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-lg border font-medium">
                      <Plus className="mr-2 h-4 w-4" />
                      Column
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-xl border">
                    <DialogHeader>
                      <DialogTitle className="font-semibold">Add Column</DialogTitle>
                      <DialogDescription>Add a new column to your sheet</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Column Name</Label>
                        <Input
                          className="rounded-lg border"
                          placeholder="e.g., Notes"
                          value={newColumn.name}
                          onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Column Type</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {columnTypes.map((type) => (
                            <button
                              key={type.value}
                              onClick={() => setNewColumn({ ...newColumn, type: type.value as BookColumn["type"] })}
                              className={`flex flex-col items-center gap-1 rounded-lg border p-2 sm:p-3 transition-all ${
                                newColumn.type === type.value
                                  ? "border-accent bg-accent/10 shadow-sm"
                                  : "border-border hover:bg-muted"
                              }`}
                            >
                              <span className="font-mono text-lg">{type.icon}</span>
                              <span className="text-xs font-medium">{type.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      {newColumn.type === "select" && (
                        <div className="space-y-2">
                          <Label className="font-medium">Options (comma separated)</Label>
                          <Input
                            className="rounded-lg border"
                            placeholder="Option 1, Option 2, Option 3"
                            value={newColumn.options}
                            onChange={(e) => setNewColumn({ ...newColumn, options: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewColumnDialog(false)} className="rounded-lg border font-medium">Cancel</Button>
                      <Button onClick={handleAddColumn} className="shadow-sm font-semibold">Add Column</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={handleAddRow} className="rounded-lg border font-medium">
                  <Plus className="mr-2 h-4 w-4" />
                  Row
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="w-12 border-r-2 border-border px-3 py-3 text-center text-xs font-semibold text-muted-foreground">#</th>
                    {activeSheet.columns.map((column) => (
                      <th
                        key={column.id}
                        className="border-r border-border px-4 py-3 text-left"
                        style={{ minWidth: column.width }}
                      >
                        <button
                          className="flex items-center gap-1 font-semibold hover:text-accent"
                          onClick={() => handleSort(column.id)}
                        >
                          {column.name}
                          {sortConfig?.column === column.id && (
                            sortConfig.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </button>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{column.type}</span>
                          {column.linkedType && (
                            <Link2 className="h-3 w-3 text-accent" />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="w-12 px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedEntries().map((entry, rowIndex) => (
                    <tr key={entry.id} className="border-b border-border hover:bg-muted/50 group">
                      <td className="border-r-2 border-border px-3 py-2 text-center text-xs font-mono text-muted-foreground">
                        {rowIndex + 1}
                      </td>
                      {activeSheet.columns.map((column) => {
                        const isEditing = editingCell?.entryId === entry.id && editingCell?.colId === column.id
                        const value = entry.cells[column.id]
                        
                        return (
                          <td
                            key={column.id}
                            className="border-r border-border px-1 py-1"
                            style={{ minWidth: column.width }}
                          >
                            {isEditing ? (
                              column.type === "select" ? (
                                <Select
                                  value={String(value)}
                                  onValueChange={(v) => handleCellChange(entry.id, column.id, v)}
                                >
                                  <SelectTrigger className="h-8 rounded-lg border">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-lg border">
                                    {column.options?.map((opt) => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : column.type === "checkbox" ? (
                                <div className="flex items-center justify-center h-8">
                                  <Checkbox
                                    checked={Boolean(value)}
                                    onCheckedChange={(checked) => handleCellChange(entry.id, column.id, Boolean(checked))}
                                    className="rounded-lg border"
                                  />
                                </div>
                              ) : (
                                <Input
                                  type={column.type === "number" || column.type === "currency" ? "number" : column.type === "date" ? "date" : "text"}
                                  className="h-8 rounded-lg border"
                                  value={String(value)}
                                  autoFocus
                                  onBlur={(e) => {
                                    const newValue = column.type === "number" || column.type === "currency" 
                                      ? parseFloat(e.target.value) || 0 
                                      : e.target.value
                                    handleCellChange(entry.id, column.id, newValue)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const newValue = column.type === "number" || column.type === "currency" 
                                        ? parseFloat((e.target as HTMLInputElement).value) || 0 
                                        : (e.target as HTMLInputElement).value
                                      handleCellChange(entry.id, column.id, newValue)
                                    }
                                    if (e.key === "Escape") setEditingCell(null)
                                  }}
                                  onChange={() => {}}
                                />
                              )
                            ) : column.type === "link" && column.linkedType ? (
                              <button
                                onClick={() => setLinkDialog({ entryId: entry.id, colId: column.id, type: column.linkedType as "invoice" | "expense" | "document" })}
                                className="flex h-8 w-full items-center gap-1 px-3 text-sm hover:bg-muted transition-colors"
                              >
                                {value ? (
                                  <Badge variant="secondary" className="border font-mono text-xs">
                                    <Link2 className="mr-1 h-3 w-3" />
                                    {getLinkedItemDisplay(column.id, value, column.linkedType)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs flex items-center gap-1">
                                    <Plus className="h-3 w-3" /> Link
                                  </span>
                                )}
                              </button>
                            ) : column.type === "checkbox" ? (
                              <div 
                                className="flex items-center justify-center h-8 cursor-pointer"
                                onClick={() => handleCellChange(entry.id, column.id, !value)}
                              >
                                {value ? (
                                  <CheckCircle2 className="h-5 w-5 text-accent" />
                                ) : (
                                  <div className="h-5 w-5 rounded-lg border border-border" />
                                )}
                              </div>
                            ) : (
                              <button
                                className="flex h-8 w-full items-center px-3 text-sm text-left hover:bg-muted transition-colors"
                                onClick={() => setEditingCell({ entryId: entry.id, colId: column.id })}
                              >
                                {column.type === "currency" ? (
                                  <span className="font-mono font-medium">{formatCurrency(Number(value) || 0)}</span>
                                ) : column.type === "date" && value ? (
                                  <span className="text-xs text-muted-foreground">{formatDate(String(value))}</span>
                                ) : column.type === "select" && value ? (
                                  <Badge variant="outline" className="rounded border font-medium text-xs">{String(value)}</Badge>
                                ) : (
                                  <span className={!value ? "text-muted-foreground" : ""}>{String(value) || "-"}</span>
                                )}
                              </button>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 rounded-lg border border-transparent hover:border-border">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg border">
                            <DropdownMenuItem className="font-medium">
                              <Paperclip className="mr-2 h-4 w-4" />
                              Attach Document
                            </DropdownMenuItem>
                            <DropdownMenuItem className="font-medium">
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate Row
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive font-medium"
                              onClick={() => deleteBookEntry(activeSheet.id, entry.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Row
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t border-border bg-secondary/50">
                    <td className="border-r-2 border-border px-3 py-3 text-center text-xs font-semibold">Σ</td>
                    {activeSheet.columns.map((column) => {
                      const total = getColumnTotal(column.id)
                      return (
                        <td key={column.id} className="border-r border-border px-4 py-3">
                          {total !== null ? (
                            <span className="font-mono font-semibold text-accent">
                              {column.type === "currency" ? formatCurrency(total) : total.toLocaleString()}
                            </span>
                          ) : null}
                        </td>
                      )
                    })}
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {activeSheet.entries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-muted">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">No entries yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Add your first row to get started</p>
                <Button onClick={handleAddRow} className="mt-4 shadow-sm font-semibold">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Entry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Link Dialog */}
      <Dialog open={!!linkDialog} onOpenChange={(open) => !open && setLinkDialog(null)}>
        <DialogContent className="rounded-xl border">
          <DialogHeader>
            <DialogTitle className="font-semibold">
              Link {linkDialog?.type === "invoice" ? "Invoice" : linkDialog?.type === "expense" ? "Expense" : "Document"}
            </DialogTitle>
            <DialogDescription>
              Connect this entry to an existing {linkDialog?.type}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2 py-4">
            {linkDialog?.type === "invoice" && invoices.map((invoice) => (
              <button
                key={invoice.id}
                onClick={() => handleLinkItem(invoice.id)}
                className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-accent" />
                  <div className="text-left">
                    <p className="font-semibold">{invoice.number}</p>
                    <p className="text-sm text-muted-foreground">{invoice.client}</p>
                  </div>
                </div>
                <span className="font-mono font-semibold">{formatCurrency(invoice.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0))}</span>
              </button>
            ))}
            {linkDialog?.type === "expense" && expenses.map((expense) => (
              <button
                key={expense.id}
                onClick={() => handleLinkItem(expense.id)}
                className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-chart-4" />
                  <div className="text-left">
                    <p className="font-semibold">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">{expense.category}</p>
                  </div>
                </div>
                <span className={`font-mono font-semibold ${expense.type === "income" ? "text-accent" : ""}`}>
                  {expense.type === "income" ? "+" : "-"}{formatCurrency(expense.amount)}
                </span>
              </button>
            ))}
            {linkDialog?.type === "document" && storage.documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleLinkItem(doc.id)}
                className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Paperclip className="h-5 w-5 text-chart-3" />
                  <div className="text-left">
                    <p className="font-semibold truncate max-w-[200px]">{doc.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{doc.type}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog(null)} className="rounded-lg border font-medium">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
