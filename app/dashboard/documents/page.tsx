"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { useDataStore, formatBytes, formatDate } from "@/lib/data-store"
import {
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  Filter,
  FolderOpen,
  HardDrive,
  Link2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Upload,
  Receipt,
  FileCheck,
  FileBadge,
  X,
} from "lucide-react"

const documentTypeIcons = {
  invoice: FileText,
  receipt: Receipt,
  certificate: FileCheck,
  contract: FileBadge,
  other: File,
}

const documentTypeColors = {
  invoice: "bg-accent",
  receipt: "bg-chart-4",
  certificate: "bg-chart-3",
  contract: "bg-chart-5",
  other: "bg-muted-foreground",
}

export default function DocumentsPage() {
  const { storage, invoices, expenses, addDocument, deleteDocument, linkDocument } = useDataStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [uploadDialog, setUploadDialog] = useState(false)
  const [linkDialog, setLinkDialog] = useState<string | null>(null)
  const [newDocument, setNewDocument] = useState({
    name: "",
    type: "receipt" as "invoice" | "receipt" | "certificate" | "contract" | "other",
    size: 0,
  })

  const filteredDocuments = storage.documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || doc.type === typeFilter
    return matchesSearch && matchesType
  })

  const storagePercentage = (storage.used / storage.total) * 100

  const handleUpload = () => {
    if (!newDocument.name) return
    // Simulate file upload with random size between 100KB and 2MB
    const size = Math.floor(Math.random() * 1900000) + 100000
    addDocument({
      name: newDocument.name,
      type: newDocument.type,
      size,
    })
    setNewDocument({ name: "", type: "receipt", size: 0 })
    setUploadDialog(false)
  }

  const handleLink = (docId: string, targetType: "expense" | "invoice", targetId: string) => {
    linkDocument(docId, targetType, targetId)
    setLinkDialog(null)
  }

  const getLinkedItemName = (linkedTo?: { type: string; id: string }) => {
    if (!linkedTo) return null
    if (linkedTo.type === "invoice") {
      const invoice = invoices.find(i => i.id === linkedTo.id)
      return invoice ? `Invoice ${invoice.number}` : null
    }
    if (linkedTo.type === "expense") {
      const expense = expenses.find(e => e.id === linkedTo.id)
      return expense?.description || null
    }
    return null
  }

  const documentsByType = storage.documents.reduce((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Documents</h1>
          <p className="text-muted-foreground">Store and manage your financial documents</p>
        </div>
        <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-lg shadow-sm font-semibold">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-lg border">
            <DialogHeader>
              <DialogTitle className="font-bold">Upload Document</DialogTitle>
              <DialogDescription>Add a new document to your storage</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Upload Zone */}
              <div className="rounded-lg border border-dashed border-border p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
              </div>
              
              <div className="space-y-2">
                <Label className="font-medium">Document Name</Label>
                <Input
                  className="rounded-lg border"
                  placeholder="e.g., Invoice-2024-001.pdf"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="font-medium">Document Type</Label>
                <Select
                  value={newDocument.type}
                  onValueChange={(v) => setNewDocument({ ...newDocument, type: v as typeof newDocument.type })}
                >
                  <SelectTrigger className="rounded-lg border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border">
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialog(false)} className="rounded-lg border font-medium">Cancel</Button>
              <Button onClick={handleUpload} className="rounded-lg shadow-sm font-semibold">Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Storage Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg border border-border shadow-sm sm:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-secondary">
                  <HardDrive className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold">Storage</h3>
                  <p className="text-sm text-muted-foreground">100 MB Free Plan</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-bold">{formatBytes(storage.used)}</p>
                <p className="text-sm text-muted-foreground">of {formatBytes(storage.total)}</p>
              </div>
            </div>
            <div className="h-3 w-full rounded-lg border border-border bg-muted overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-500" 
                style={{ width: `${storagePercentage}%` }} 
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {storagePercentage.toFixed(1)}% used · {formatBytes(storage.total - storage.used)} available
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Documents</span>
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-2 font-mono text-3xl font-bold">{storage.documents.length}</div>
            <p className="mt-1 text-sm text-muted-foreground">Files stored</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Linked</span>
              <Link2 className="h-5 w-5 text-accent" />
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-accent">
              {storage.documents.filter(d => d.linkedTo).length}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Connected documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Document Type Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
        {(["invoice", "receipt", "certificate", "contract", "other"] as const).map((type) => {
          const Icon = documentTypeIcons[type]
          const color = documentTypeColors[type]
          const count = documentsByType[type] || 0
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
              className={`rounded-lg border p-4 text-left transition-all ${
                typeFilter === type 
                  ? "border-accent bg-accent/10 shadow-sm ring-1 ring-accent" 
                  : "border-border hover:bg-muted"
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center ${color} mb-2`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="font-mono text-xl font-bold">{count}</p>
              <p className="text-xs font-medium text-muted-foreground capitalize">{type}s</p>
            </button>
          )
        })}
      </div>

      {/* Search & Filters */}
      <Card className="rounded-lg border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-9 rounded-lg border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 rounded-lg border">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
                <SelectItem value="receipt">Receipts</SelectItem>
                <SelectItem value="certificate">Certificates</SelectItem>
                <SelectItem value="contract">Contracts</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="rounded-lg border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-bold">All Documents</CardTitle>
          <CardDescription>
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDocuments.length > 0 ? (
            <div className="divide-y-2 divide-border">
              {filteredDocuments.map((doc) => {
                const Icon = documentTypeIcons[doc.type]
                const color = documentTypeColors[doc.type]
                const linkedName = getLinkedItemName(doc.linkedTo)
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center ${color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{doc.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{doc.type}</span>
                          <span>·</span>
                          <span className="font-mono">{formatBytes(doc.size)}</span>
                          <span>·</span>
                          <span>{formatDate(doc.uploadDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {linkedName ? (
                        <Badge variant="secondary" className="rounded-lg border font-medium">
                          <Link2 className="mr-1 h-3 w-3" />
                          {linkedName}
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg border border-transparent hover:border-border font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setLinkDialog(doc.id)}
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          Link
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg border border-transparent hover:border-border">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-lg border">
                          <DropdownMenuItem className="font-medium">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem className="font-medium">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLinkDialog(doc.id)} className="font-medium">
                            <Link2 className="mr-2 h-4 w-4" />
                            {linkedName ? "Change Link" : "Link to..."}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive font-medium"
                            onClick={() => deleteDocument(doc.id)}
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
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold">No documents found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || typeFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Upload your first document to get started"}
              </p>
              {!searchQuery && typeFilter === "all" && (
                <Button onClick={() => setUploadDialog(true)} className="mt-4 rounded-lg shadow-sm font-semibold">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Dialog */}
      <Dialog open={!!linkDialog} onOpenChange={(open) => !open && setLinkDialog(null)}>
        <DialogContent className="rounded-lg border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">Link Document</DialogTitle>
            <DialogDescription>Connect this document to an invoice or expense</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="font-medium mb-2 block">Invoices</Label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {invoices.map((invoice) => (
                  <button
                    key={invoice.id}
                    onClick={() => linkDialog && handleLink(linkDialog, "invoice", invoice.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-accent" />
                      <span className="font-medium">{invoice.number}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{invoice.client}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="font-medium mb-2 block">Expenses</Label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {expenses.filter(e => e.type === "expense").map((expense) => (
                  <button
                    key={expense.id}
                    onClick={() => linkDialog && handleLink(linkDialog, "expense", expense.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="h-5 w-5 text-chart-4" />
                      <span className="font-medium">{expense.description}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{expense.category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog(null)} className="rounded-lg border font-medium">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
