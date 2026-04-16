"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { invoicesAPI, expensesAPI, documentsAPI, bookSheetsAPI, bookEntriesAPI, budgetsAPI, projectsAPI, initAPI } from "./api-client"
import { useUser, type UserProfile } from "./user-context"

// Types
export interface Document {
  id: string
  name: string
  type: "invoice" | "receipt" | "certificate" | "contract" | "other"
  size: number
  uploadDate: string
  linkedTo?: {
    type: "expense" | "invoice" | "book_entry"
    id: string
  }
  url?: string
  key?: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  number: string
  client: string
  clientEmail: string
  clientAddress?: string
  items: InvoiceItem[]
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  issueDate: string
  dueDate: string
  paidDate?: string
  notes?: string
  linkedDocuments: string[]
  linkedBookEntries: string[]
  taxRate?: number
  currency: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  paymentMethod: string
  type: "expense" | "income"
  notes?: string
  linkedDocuments: string[]
  linkedInvoice?: string
  linkedBookEntries: string[]
  isRecurring?: boolean
  recurringFrequency?: "weekly" | "monthly" | "yearly"
  tags: string[]
}

export interface BookEntry {
  id: string
  cells: Record<string, string | number | boolean>
  linkedDocuments: string[]
  linkedExpenses: string[]
  linkedInvoices: string[]
  createdAt: string
  updatedAt: string
}

export interface BookColumn {
  id: string
  name: string
  type: "text" | "number" | "currency" | "date" | "select" | "checkbox" | "link" | "formula"
  width?: number
  options?: string[]
  formula?: string
  required?: boolean
  linkedType?: "expense" | "invoice" | "document"
}

export interface BookSheet {
  id: string
  name: string
  icon?: string
  color?: string
  columns: BookColumn[]
  entries: BookEntry[]
  createdAt: string
  updatedAt: string
  isTemplate?: boolean
}

export interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  category: string
  period: "monthly" | "yearly" | "custom"
  startDate: string
  endDate?: string
  color: string
}

export interface Project {
  id: string
  name: string
  client: string
  status: "planning" | "active" | "completed" | "on_hold"
  budget: number
  spent: number
  startDate: string
  endDate?: string
  description?: string
  linkedInvoices: string[]
  linkedExpenses: string[]
}

export interface StorageInfo {
  used: number
  total: number
  documents: Document[]
}

// Derived transaction shape used by the dashboard widgets
export interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: string
  type: "expense" | "income"
}

// Context
interface DataStoreContextType {
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>

  /** User profile, surfaced here so pages can read it without a second hook. */
  userProfile: UserProfile | null
  updateUserProfile: (updates: Partial<UserProfile>) => void

  invoices: Invoice[]
  addInvoice: (invoice: Omit<Invoice, "id" | "number" | "linkedDocuments" | "linkedBookEntries">) => Promise<string>
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>

  expenses: Expense[]
  /** Derived: income + expense rows sorted by date desc. */
  transactions: Transaction[]
  addExpense: (expense: Omit<Expense, "id" | "linkedDocuments" | "linkedBookEntries">) => Promise<string>
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>

  sheets: BookSheet[]
  /** Derived: flat book entries across all sheets (newest first). */
  bookEntries: Array<BookEntry & { sheetId: string }>
  addSheet: (sheet: Omit<BookSheet, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updateSheet: (id: string, updates: Partial<BookSheet>) => Promise<void>
  deleteSheet: (id: string) => Promise<void>
  addBookEntry: (sheetId: string, entry: Omit<BookEntry, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updateBookEntry: (sheetId: string, entryId: string, updates: Partial<BookEntry>) => Promise<void>
  deleteBookEntry: (sheetId: string, entryId: string) => Promise<void>

  budgets: Budget[]
  addBudget: (budget: Omit<Budget, "id">) => Promise<string>
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>

  projects: Project[]
  addProject: (project: Omit<Project, "id">) => Promise<string>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  storage: StorageInfo
  /** Alias for storage.documents to make pages more readable. */
  documents: Document[]
  addDocument: (doc: Omit<Document, "id" | "uploadDate">) => Promise<string>
  deleteDocument: (id: string) => Promise<void>
  linkDocument: (docId: string, targetType: "expense" | "invoice" | "book_entry", targetId: string) => Promise<void>

  linkExpenseToInvoice: (expenseId: string, invoiceId: string) => Promise<void>
  linkToBook: (type: "expense" | "invoice", itemId: string, sheetId: string, entryId: string) => Promise<void>

  exportData: (type: "all" | "invoices" | "expenses" | "book") => string
  importData: (jsonData: string, type: "invoices" | "expenses" | "book") => boolean
}

const DataStoreContext = createContext<DataStoreContextType | null>(null)

const STORAGE_LIMIT = 524288000 // 500MB

// Transform API data to frontend format
const transformInvoice = (inv: Record<string, unknown>): Invoice => ({
  id: inv.id as string,
  number: inv.number as string,
  client: inv.client as string,
  clientEmail: inv.clientEmail as string,
  clientAddress: inv.clientAddress as string | undefined,
  items: (inv.items as Record<string, unknown>[])?.map(item => ({
    id: item.id as string,
    description: item.description as string,
    quantity: item.quantity as number,
    unitPrice: item.unitPrice as number,
  })) || [],
  status: inv.status as Invoice["status"],
  issueDate: new Date(inv.issueDate as string).toISOString().split("T")[0],
  dueDate: new Date(inv.dueDate as string).toISOString().split("T")[0],
  paidDate: inv.paidDate ? new Date(inv.paidDate as string).toISOString().split("T")[0] : undefined,
  notes: inv.notes as string | undefined,
  linkedDocuments: (inv.linkedDocuments as string[]) || [],
  linkedBookEntries: (inv.linkedBookEntries as string[]) || [],
  taxRate: inv.taxRate as number | undefined,
  currency: (inv.currency as string) || "EUR",
})

const transformExpense = (exp: Record<string, unknown>): Expense => ({
  id: exp.id as string,
  description: exp.description as string,
  amount: exp.amount as number,
  category: exp.category as string,
  date: new Date(exp.date as string).toISOString().split("T")[0],
  paymentMethod: exp.paymentMethod as string,
  type: exp.type as Expense["type"],
  notes: exp.notes as string | undefined,
  linkedDocuments: (exp.linkedDocuments as string[]) || [],
  linkedInvoice: exp.linkedInvoice as string | undefined,
  linkedBookEntries: (exp.linkedBookEntries as string[]) || [],
  isRecurring: exp.isRecurring as boolean | undefined,
  recurringFrequency: exp.recurringFrequency as Expense["recurringFrequency"] | undefined,
  tags: (exp.tags as string[]) || [],
})

const transformBudget = (bud: Record<string, unknown>): Budget => ({
  id: bud.id as string,
  name: bud.name as string,
  amount: bud.amount as number,
  spent: (bud.spent as number) || 0,
  category: bud.category as string,
  period: bud.period as Budget["period"],
  startDate: new Date(bud.startDate as string).toISOString().split("T")[0],
  endDate: bud.endDate ? new Date(bud.endDate as string).toISOString().split("T")[0] : undefined,
  color: bud.color as string,
})

const transformProject = (proj: Record<string, unknown>): Project => ({
  id: proj.id as string,
  name: proj.name as string,
  client: proj.client as string,
  status: proj.status as Project["status"],
  budget: proj.budget as number,
  spent: (proj.spent as number) || 0,
  startDate: new Date(proj.startDate as string).toISOString().split("T")[0],
  endDate: proj.endDate ? new Date(proj.endDate as string).toISOString().split("T")[0] : undefined,
  description: proj.description as string | undefined,
  linkedInvoices: (proj.linkedInvoices as string[]) || [],
  linkedExpenses: (proj.linkedExpenses as string[]) || [],
})

const transformDocument = (doc: Record<string, unknown>): Document => ({
  id: doc.id as string,
  name: doc.name as string,
  type: doc.type as Document["type"],
  size: doc.size as number,
  uploadDate: new Date(doc.createdAt as string).toISOString().split("T")[0],
  url: doc.url as string,
  key: doc.key as string,
  linkedTo: doc.linkedToId ? { type: doc.linkedToType as "expense" | "invoice" | "book_entry", id: doc.linkedToId as string } : undefined,
})

const transformSheet = (sheet: Record<string, unknown>): BookSheet => ({
  id: sheet.id as string,
  name: sheet.name as string,
  icon: sheet.icon as string | undefined,
  color: sheet.color as string | undefined,
  columns: (sheet.columns as BookColumn[]) || [],
  entries: ((sheet.entries as Record<string, unknown>[]) || []).map(entry => ({
    id: entry.id as string,
    cells: (entry.cells as Record<string, string | number | boolean>) || {},
    linkedDocuments: (entry.linkedDocuments as string[]) || [],
    linkedExpenses: (entry.linkedExpenses as string[]) || [],
    linkedInvoices: (entry.linkedInvoices as string[]) || [],
    createdAt: new Date(entry.createdAt as string).toISOString(),
    updatedAt: new Date(entry.updatedAt as string).toISOString(),
  })),
  createdAt: new Date(sheet.createdAt as string).toISOString(),
  updatedAt: new Date(sheet.updatedAt as string).toISOString(),
  isTemplate: sheet.isTemplate as boolean | undefined,
})

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const { profile: userProfile, updateProfile: updateUserProfile } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [sheets, setSheets] = useState<BookSheet[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [documents, setDocuments] = useState<Document[]>([])

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Initialize user if needed
      await initAPI.initialize()
      
      // Fetch all data in parallel
      const [invoicesData, expensesData, sheetsData, budgetsData, projectsData, documentsData] = await Promise.all([
        invoicesAPI.getAll(),
        expensesAPI.getAll(),
        bookSheetsAPI.getAll(),
        budgetsAPI.getAll(),
        projectsAPI.getAll(),
        documentsAPI.getAll(),
      ])
      
      setInvoices((invoicesData as Record<string, unknown>[]).map(transformInvoice))
      setExpenses((expensesData as Record<string, unknown>[]).map(transformExpense))
      setSheets((sheetsData as Record<string, unknown>[]).map(transformSheet))
      setBudgets((budgetsData as Record<string, unknown>[]).map(transformBudget))
      setProjects((projectsData as Record<string, unknown>[]).map(transformProject))
      setDocuments((documentsData as Record<string, unknown>[]).map(transformDocument))
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Invoice functions
  const addInvoice = async (invoice: Omit<Invoice, "id" | "number" | "linkedDocuments" | "linkedBookEntries">) => {
    const newInvoice = await invoicesAPI.create({
      ...invoice,
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
      paidDate: invoice.paidDate ? new Date(invoice.paidDate) : undefined,
      items: invoice.items,
    })
    const transformed = transformInvoice(newInvoice as Record<string, unknown>)
    setInvoices(prev => [transformed, ...prev])
    return transformed.id
  }

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const apiUpdates: Record<string, unknown> = { ...updates }
    if (updates.issueDate) apiUpdates.issueDate = new Date(updates.issueDate)
    if (updates.dueDate) apiUpdates.dueDate = new Date(updates.dueDate)
    if (updates.paidDate) apiUpdates.paidDate = new Date(updates.paidDate)
    
    await invoicesAPI.update(id, apiUpdates)
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv))
  }

  const deleteInvoice = async (id: string) => {
    await invoicesAPI.delete(id)
    setInvoices(prev => prev.filter(inv => inv.id !== id))
  }

  // Expense functions
  const addExpense = async (expense: Omit<Expense, "id" | "linkedDocuments" | "linkedBookEntries">) => {
    const newExpense = await expensesAPI.create({
      ...expense,
      date: new Date(expense.date),
    })
    const transformed = transformExpense(newExpense as Record<string, unknown>)
    setExpenses(prev => [transformed, ...prev])
    return transformed.id
  }

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const apiUpdates: Record<string, unknown> = { ...updates }
    if (updates.date) apiUpdates.date = new Date(updates.date)
    
    await expensesAPI.update(id, apiUpdates)
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updates } : exp))
  }

  const deleteExpense = async (id: string) => {
    await expensesAPI.delete(id)
    setExpenses(prev => prev.filter(exp => exp.id !== id))
  }

  // Book functions
  const addSheet = async (sheet: Omit<BookSheet, "id" | "createdAt" | "updatedAt">) => {
    const newSheet = await bookSheetsAPI.create({
      ...sheet,
      columns: sheet.columns,
    })
    const transformed = transformSheet(newSheet as Record<string, unknown>)
    setSheets(prev => [...prev, transformed])
    return transformed.id
  }

  const updateSheet = async (id: string, updates: Partial<BookSheet>) => {
    await bookSheetsAPI.update(id, { ...updates, columns: updates.columns })
    setSheets(prev => prev.map(sheet => sheet.id === id ? { ...sheet, ...updates, updatedAt: new Date().toISOString() } : sheet))
  }

  const deleteSheet = async (id: string) => {
    await bookSheetsAPI.delete(id)
    setSheets(prev => prev.filter(sheet => sheet.id !== id))
  }

  const addBookEntry = async (sheetId: string, entry: Omit<BookEntry, "id" | "createdAt" | "updatedAt">) => {
    const newEntry = await bookEntriesAPI.create({
      sheetId,
      cells: entry.cells,
      linkedDocuments: entry.linkedDocuments,
      linkedExpenses: entry.linkedExpenses,
      linkedInvoices: entry.linkedInvoices,
    })
    const transformedEntry = {
      id: (newEntry as Record<string, unknown>).id as string,
      cells: (newEntry as Record<string, unknown>).cells as Record<string, string | number | boolean>,
      linkedDocuments: ((newEntry as Record<string, unknown>).linkedDocuments as string[]) || [],
      linkedExpenses: ((newEntry as Record<string, unknown>).linkedExpenses as string[]) || [],
      linkedInvoices: ((newEntry as Record<string, unknown>).linkedInvoices as string[]) || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    setSheets(prev => prev.map(sheet => 
      sheet.id === sheetId 
        ? { ...sheet, entries: [...sheet.entries, transformedEntry], updatedAt: new Date().toISOString() }
        : sheet
    ))
    return transformedEntry.id
  }

  const updateBookEntry = async (sheetId: string, entryId: string, updates: Partial<BookEntry>) => {
    await bookEntriesAPI.update(entryId, sheetId, { cells: updates.cells })
    setSheets(prev => prev.map(sheet => 
      sheet.id === sheetId 
        ? { 
            ...sheet,
            entries: sheet.entries.map(entry => entry.id === entryId ? { ...entry, ...updates, updatedAt: new Date().toISOString() } : entry),
            updatedAt: new Date().toISOString(),
          }
        : sheet
    ))
  }

  const deleteBookEntry = async (sheetId: string, entryId: string) => {
    await bookEntriesAPI.delete(entryId, sheetId)
    setSheets(prev => prev.map(sheet => 
      sheet.id === sheetId 
        ? { ...sheet, entries: sheet.entries.filter(e => e.id !== entryId), updatedAt: new Date().toISOString() }
        : sheet
    ))
  }

  // Budget functions
  const addBudget = async (budget: Omit<Budget, "id">) => {
    const newBudget = await budgetsAPI.create({
      ...budget,
      startDate: new Date(budget.startDate),
      endDate: budget.endDate ? new Date(budget.endDate) : undefined,
    })
    const transformed = transformBudget(newBudget as Record<string, unknown>)
    setBudgets(prev => [...prev, transformed])
    return transformed.id
  }

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const apiUpdates: Record<string, unknown> = { ...updates }
    if (updates.startDate) apiUpdates.startDate = new Date(updates.startDate)
    if (updates.endDate) apiUpdates.endDate = new Date(updates.endDate)
    
    await budgetsAPI.update(id, apiUpdates)
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  const deleteBudget = async (id: string) => {
    await budgetsAPI.delete(id)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  // Project functions
  const addProject = async (project: Omit<Project, "id">) => {
    const newProject = await projectsAPI.create({
      ...project,
      startDate: new Date(project.startDate),
      endDate: project.endDate ? new Date(project.endDate) : undefined,
    })
    const transformed = transformProject(newProject as Record<string, unknown>)
    setProjects(prev => [...prev, transformed])
    return transformed.id
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const apiUpdates: Record<string, unknown> = { ...updates }
    if (updates.startDate) apiUpdates.startDate = new Date(updates.startDate)
    if (updates.endDate) apiUpdates.endDate = new Date(updates.endDate)
    
    await projectsAPI.update(id, apiUpdates)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const deleteProject = async (id: string) => {
    await projectsAPI.delete(id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  // Storage & Documents
  const storage: StorageInfo = {
    used: documents.reduce((acc, doc) => acc + doc.size, 0),
    total: STORAGE_LIMIT,
    documents,
  }

  const addDocument = async (doc: Omit<Document, "id" | "uploadDate">) => {
    const newDoc = await documentsAPI.create({
      name: doc.name,
      type: doc.type,
      size: doc.size,
      url: doc.url,
      key: doc.key,
      linkedToType: doc.linkedTo?.type,
      linkedToId: doc.linkedTo?.id,
    })
    const transformed = transformDocument(newDoc as Record<string, unknown>)
    setDocuments(prev => [...prev, transformed])
    return transformed.id
  }

  const deleteDocument = async (id: string) => {
    await documentsAPI.delete(id)
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const linkDocument = async (docId: string, targetType: "expense" | "invoice" | "book_entry", targetId: string) => {
    await documentsAPI.update(docId, { linkedToType: targetType, linkedToId: targetId })
    setDocuments(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, linkedTo: { type: targetType, id: targetId } } : doc
    ))
  }

  // Linking utilities
  const linkExpenseToInvoice = async (expenseId: string, invoiceId: string) => {
    await expensesAPI.update(expenseId, { linkedInvoice: invoiceId })
    setExpenses(prev => prev.map(exp => 
      exp.id === expenseId ? { ...exp, linkedInvoice: invoiceId } : exp
    ))
  }

  const linkToBook = async (type: "expense" | "invoice", itemId: string, sheetId: string, entryId: string) => {
    const linkKey = `${sheetId}:${entryId}`
    if (type === "expense") {
      const expense = expenses.find(e => e.id === itemId)
      if (expense) {
        const newLinks = [...expense.linkedBookEntries, linkKey]
        await expensesAPI.update(itemId, { linkedBookEntries: newLinks })
        setExpenses(prev => prev.map(exp => 
          exp.id === itemId ? { ...exp, linkedBookEntries: newLinks } : exp
        ))
      }
    } else {
      const invoice = invoices.find(i => i.id === itemId)
      if (invoice) {
        const newLinks = [...invoice.linkedBookEntries, linkKey]
        await invoicesAPI.update(itemId, { linkedBookEntries: newLinks })
        setInvoices(prev => prev.map(inv => 
          inv.id === itemId ? { ...inv, linkedBookEntries: newLinks } : inv
        ))
      }
    }
  }

  // Import/Export (local only)
  const exportData = (type: "all" | "invoices" | "expenses" | "book") => {
    const data: Record<string, unknown> = {}
    if (type === "all" || type === "invoices") data.invoices = invoices
    if (type === "all" || type === "expenses") data.expenses = expenses
    if (type === "all" || type === "book") data.sheets = sheets
    if (type === "all") {
      data.budgets = budgets
      data.projects = projects
      data.documents = documents
    }
    return JSON.stringify(data, null, 2)
  }

  const importData = (jsonData: string, type: "invoices" | "expenses" | "book") => {
    try {
      const data = JSON.parse(jsonData)
      if (type === "invoices" && data.invoices) setInvoices(data.invoices)
      if (type === "expenses" && data.expenses) setExpenses(data.expenses)
      if (type === "book" && data.sheets) setSheets(data.sheets)
      return true
    } catch {
      return false
    }
  }

  // Derived: transactions from expenses (sorted newest first)
  const transactions: Transaction[] = useMemo(() => {
    return expenses
      .map(exp => ({
        id: exp.id,
        description: exp.description,
        amount: exp.type === "income" ? Math.abs(exp.amount) : -Math.abs(exp.amount),
        category: exp.category,
        date: exp.date,
        type: exp.type,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [expenses])

  // Derived: flat book entries across sheets, newest first
  const bookEntries = useMemo(() => {
    return sheets
      .flatMap(sheet => sheet.entries.map(entry => ({ ...entry, sheetId: sheet.id })))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [sheets])

  return (
    <DataStoreContext.Provider value={{
      isLoading,
      error,
      refresh: fetchAllData,
      userProfile,
      updateUserProfile,
      invoices, addInvoice, updateInvoice, deleteInvoice,
      expenses, transactions, addExpense, updateExpense, deleteExpense,
      sheets, bookEntries, addSheet, updateSheet, deleteSheet, addBookEntry, updateBookEntry, deleteBookEntry,
      budgets, addBudget, updateBudget, deleteBudget,
      projects, addProject, updateProject, deleteProject,
      storage, documents, addDocument, deleteDocument, linkDocument,
      linkExpenseToInvoice, linkToBook,
      exportData, importData,
    }}>
      {children}
    </DataStoreContext.Provider>
  )
}

export function useDataStore() {
  const context = useContext(DataStoreContext)
  if (!context) {
    throw new Error("useDataStore must be used within a DataStoreProvider")
  }
  return context
}

// Utility functions
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Locale-aware currency formatter. Picks browser locale by default, or the provided one.
 * This is the single source of truth for currency display across the app.
 */
export function formatCurrency(amount: number, currency = "EUR", locale?: string): string {
  const targetLocale =
    locale ||
    (typeof navigator !== "undefined" ? navigator.language : undefined) ||
    "en-US"
  try {
    return new Intl.NumberFormat(targetLocale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function formatDate(date: string, locale?: string): string {
  const targetLocale =
    locale ||
    (typeof navigator !== "undefined" ? navigator.language : undefined) ||
    "en-US"
  return new Date(date).toLocaleDateString(targetLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
