"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "convex/react"
import { useSearchParams } from "next/navigation"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useWorkspace } from "@/lib/workspace-context"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
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
import { EmptyState } from "@/components/empty-state"
import { GlassCard } from "@/components/glass-card"
import { AttachmentsField } from "@/components/attachments-field"
import { Plus, FileText, Trash2, Loader2, MoreHorizontal, CheckCircle2, Clock, AlertCircle, Send, Search, Filter, ArrowRight } from "@/components/iconsax"
import { toast } from "sonner"

const STATUS_VARIANT: Record<string, string> = {
  draft: "bg-muted text-foreground",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
}

function newItem() {
  return { id: Math.random().toString(36).slice(2), description: "", quantity: 1, unitPrice: 0 }
}

export default function InvoicesPage() {
  const t = useTranslations("pages.invoices")
  const tCommon = useTranslations("common")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const currency = activeWorkspace?.currency ?? "EUR"
  const searchParams = useSearchParams()

  const invoices = useQuery(api.a2e_invoices.list, wsId ? { workspaceId: wsId } : "skip")
  const projects = useQuery(api.projects.list, wsId ? { workspaceId: wsId } : "skip")
  const clients = useQuery(api.a2e_clients.list, wsId ? { workspaceId: wsId } : "skip")
  const create = useMutation(api.a2e_invoices.create)
  const update = useMutation(api.a2e_invoices.update)
  const remove = useMutation(api.a2e_invoices.remove)

  // Filters
  const [query, setQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  const [filterProject, setFilterProject] = React.useState<string>("all")
  const [showFilters, setShowFilters] = React.useState(false)

  const filtered = React.useMemo(() => {
    let list = invoices ?? []
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((inv) => inv.client.toLowerCase().includes(q) || inv.number.toLowerCase().includes(q))
    }
    if (filterStatus !== "all") list = list.filter((inv) => inv.status === filterStatus)
    if (filterProject !== "all") list = list.filter((inv) => inv.projectId === filterProject)
    return list
  }, [invoices, query, filterStatus, filterProject])

  const projectMap = React.useMemo(() => {
    const m = new Map<string, any>()
    for (const p of projects ?? []) m.set(p._id, p)
    return m
  }, [projects])

  const clientMap = React.useMemo(() => {
    const m = new Map<string, any>()
    for (const c of clients ?? []) m.set(c._id, c)
    return m
  }, [clients])

  const [open, setOpen] = React.useState(false)
  const [client, setClient] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [clientAddress, setClientAddress] = React.useState("")
  const [issueDate, setIssueDate] = React.useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = React.useState(new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0])
  const [items, setItems] = React.useState([newItem()])
  const [notes, setNotes] = React.useState("")
  const [projectId, setProjectId] = React.useState<string>("")
  const [linkedClientId, setLinkedClientId] = React.useState<string>("")
  const [taxRate, setTaxRate] = React.useState("0")
  const [savedId, setSavedId] = React.useState<Id<"a2e_invoices"> | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => { if (searchParams.get("new")) setOpen(true) }, [searchParams])

  const subtotal = items.reduce((a, b) => a + b.quantity * b.unitPrice, 0)
  const tax = subtotal * (parseFloat(taxRate) / 100 || 0)
  const total = subtotal + tax

  function resetForm() {
    setClient(""); setClientEmail(""); setClientAddress(""); setItems([newItem()]); setNotes(""); setProjectId(""); setLinkedClientId(""); setTaxRate("0"); setSavedId(null)
  }
  function closeDialog() { setOpen(false); setTimeout(resetForm, 200) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!wsId) return
    try {
      setSaving(true)
      const id = await create({
        workspaceId: wsId,
        client: client.trim(), clientEmail: clientEmail.trim(),
        clientAddress: clientAddress.trim() || undefined,
        items: items.filter((i) => i.description.trim()),
        issueDate: new Date(issueDate).getTime(),
        dueDate: new Date(dueDate).getTime(),
        notes: notes.trim() || undefined,
        taxRate: parseFloat(taxRate) || undefined,
        currency,
        projectId: projectId ? (projectId as Id<"projects">) : undefined,
        linkedClientId: linkedClientId ? (linkedClientId as Id<"a2e_clients">) : undefined,
      })
      setSavedId(id)
      toast.success(t("toasts.created"))
    } catch (err: any) {
      toast.error(err?.message || t("toasts.failed"))
    } finally { setSaving(false) }
  }

  async function markStatus(id: Id<"a2e_invoices">, status: "draft" | "sent" | "paid" | "overdue" | "cancelled") {
    try {
      await update({ invoiceId: id, status, paidDate: status === "paid" ? Date.now() : undefined })
      toast.success(t("toasts.marked", { status: t(`status.${status}`) }))
    } catch (err: any) { toast.error(err?.message || t("toasts.failed")) }
  }

  // Client autocomplete
  function handleClientSelect(clientId: string) {
    setLinkedClientId(clientId)
    const c = clientMap.get(clientId)
    if (c) {
      setClient(c.name)
      setClientEmail(c.email || "")
      setClientAddress(c.address || "")
    }
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2 rounded-full">
              <Link href="/dashboard/clients">
                {tCommon("clients")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Dialog open={open} onOpenChange={(o) => (o ? setOpen(o) : closeDialog())}>
              <DialogTrigger asChild><Button className="gap-2 rounded-full shadow-sm"><Plus className="h-4 w-4" /> {t("new")}</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{savedId ? t("attach.title") : t("new")}</DialogTitle></DialogHeader>
                {!savedId ? (
                  <form onSubmit={handleSave} className="space-y-5">
                    <div>
                      <Label>{t("linkedClient")}</Label>
                      <Select value={linkedClientId} onValueChange={handleClientSelect}>
                        <SelectTrigger className="w-full"><SelectValue placeholder={t("selectClient")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{t("noClient")}</SelectItem>
                          {(clients ?? []).map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>{tCommon("client")}</Label><Input value={client} onChange={(e) => setClient(e.target.value)} required /></div>
                      <div><Label>{t("clientEmail")}</Label><Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required /></div>
                    </div>
                    <div><Label>{t("clientAddress")}</Label><Textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} rows={2} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>{t("issueDate")}</Label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required /></div>
                      <div><Label>{t("dueDate")}</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("lineItems")}</Label>
                      {items.map((it, idx) => (
                        <div key={it.id} className="grid grid-cols-[1fr_80px_100px_auto] items-end gap-2">
                          <Input placeholder={tCommon("description")} value={it.description} onChange={(e) => { const copy = [...items]; copy[idx] = { ...it, description: e.target.value }; setItems(copy) }} />
                          <Input type="number" min="0" step="1" value={it.quantity} onChange={(e) => { const copy = [...items]; copy[idx] = { ...it, quantity: parseFloat(e.target.value || "0") }; setItems(copy) }} />
                          <Input type="number" min="0" step="0.01" value={it.unitPrice} onChange={(e) => { const copy = [...items]; copy[idx] = { ...it, unitPrice: parseFloat(e.target.value || "0") }; setItems(copy) }} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={items.length === 1}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, newItem()])}><Plus className="mr-1 h-3.5 w-3.5" /> {t("addLine")}</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>{t("taxRate")}</Label><Input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
                      {(projects ?? []).length > 0 && (
                        <div><Label>{tCommon("project")}</Label>
                          <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">—</SelectItem>
                              {(projects ?? []).map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div><Label>{tCommon("notes")}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <div className="text-sm text-muted-foreground">{t("subtotal")}: {formatCurrency(subtotal, currency)}</div>
                      <div className="text-sm text-muted-foreground">{t("tax")}: {formatCurrency(tax, currency)}</div>
                      <div className="text-base font-semibold">{t("total")}: {formatCurrency(total, currency)}</div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={closeDialog}>{tCommon("cancel")}</Button>
                      <Button type="submit" disabled={saving || !client.trim() || !clientEmail.trim()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tCommon("create")}</Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t("attach.description")}</p>
                    <AttachmentsField linkedTo={{ type: "invoice", id: savedId }} documentType="invoice" max={10} />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={closeDialog}>{tCommon("done")}</Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={t("searchPlaceholder")} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters((s) => !s)}>
              <Filter className="h-4 w-4" /> {t("filters")}
            </Button>
          </div>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-xs">{tCommon("status")}</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                    {(["draft", "sent", "paid", "overdue", "cancelled"] as const).map((s) => (
                      <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{tCommon("project")}</Label>
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allProjects")}</SelectItem>
                    {(projects ?? []).map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </GlassCard>

        {/* List */}
        <div className="grid gap-4">
          {invoices === undefined ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <GlassCard><EmptyState icon={FileText} title={query || filterStatus !== "all" ? t("empty.filteredTitle") : t("empty.title")} description={query || filterStatus !== "all" ? t("empty.filteredDescription") : t("empty.description")} action={!query && filterStatus === "all" ? { onClick: () => setOpen(true), label: t("new") } : undefined} /></GlassCard>
          ) : (
            filtered.map((inv, idx) => (
              <motion.div key={inv._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * idx }}>
                <GlassCard className="group p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={STATUS_VARIANT[inv.status]}>{t(`status.${inv.status}`)}</Badge>
                        <span className="text-xs text-muted-foreground">{inv.number}</span>
                      </div>
                      <h3 className="mt-1 text-base font-semibold">{inv.client}</h3>
                      <p className="text-xs text-muted-foreground">{inv.clientEmail}</p>
                      {inv.projectId && projectMap.get(inv.projectId) && (
                        <p className="mt-1 text-xs text-accent">
                          <Link href={`/dashboard/projects/${inv.projectId}`} className="hover:underline">{projectMap.get(inv.projectId).name}</Link>
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{t("issueDate")}: {formatDate(inv.issueDate)}</span>
                        <span>·</span>
                        <span>{t("dueDate")}: {formatDate(inv.dueDate)}</span>
                        {inv.paidDate && (
                          <>
                            <span>·</span>
                            <span className="text-accent">{t("paidDate")}: {formatDate(inv.paidDate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{formatCurrency(inv.items.reduce((a, b) => a + b.quantity * b.unitPrice, 0), currency)}</p>
                      {inv.taxRate ? <p className="text-xs text-muted-foreground">{t("tax")} {inv.taxRate}%</p> : null}
                      <div className="mt-2 flex justify-end gap-1">
                        {inv.status === "draft" && (
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => markStatus(inv._id, "sent")}>
                            <Send className="h-3.5 w-3.5" /> {t("markSent")}
                          </Button>
                        )}
                        {inv.status === "sent" && (
                          <>
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => markStatus(inv._id, "paid")}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> {t("markPaid")}
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={() => markStatus(inv._id, "overdue")}>
                              <AlertCircle className="h-3.5 w-3.5" /> {t("markOverdue")}
                            </Button>
                          </>
                        )}
                        {inv.status === "overdue" && (
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => markStatus(inv._id, "paid")}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> {t("markPaid")}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 transition-opacity group-hover:opacity-100" onClick={() => remove({ invoiceId: inv._id })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
