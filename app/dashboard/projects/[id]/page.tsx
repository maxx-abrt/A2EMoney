"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useWorkspace } from "@/lib/workspace-context"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlassCard } from "@/components/glass-card"
import { AttachmentsField } from "@/components/attachments-field"
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Loader2,
  Trash2,
  ClipboardList,
  FileText,
  HardDrive,
  Receipt,
} from "@/components/iconsax"
import { toast } from "sonner"

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  on_hold: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  completed: "bg-muted text-muted-foreground",
}

const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#f59e0b", "#ef4444", "#10b981", "#06b6d4"]

export default function ProjectHubPage() {
  const t = useTranslations("pages.projects")
  const tCommon = useTranslations("common")
  const params = useParams<{ id: string }>()
  const projectId = params?.id as Id<"projects">
  const { activeWorkspace } = useWorkspace()
  const currency = activeWorkspace?.currency ?? "EUR"

  const project = useQuery(api.projects.get, projectId ? { projectId } : "skip")
  const expenses = useQuery(api.a2e_expenses.listByProject, projectId ? { projectId } : "skip")
  const fiches = useQuery(api.a2e_fiches.list, activeWorkspace?._id ? { workspaceId: activeWorkspace._id, projectId } : "skip")
  const docs = useQuery(api.a2e_documents.list, activeWorkspace?._id ? { workspaceId: activeWorkspace._id, linkedToType: "project", linkedToId: projectId } : "skip")

  const updateProject = useMutation(api.projects.update)
  const createExpense = useMutation(api.a2e_expenses.create)

  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  // Inline edit state
  const [editName, setEditName] = React.useState("")
  const [editClient, setEditClient] = React.useState("")
  const [editBudget, setEditBudget] = React.useState("")
  const [editStatus, setEditStatus] = React.useState<"planning" | "active" | "on_hold" | "completed">("planning")
  const [editColor, setEditColor] = React.useState(COLORS[0])
  const [editDescription, setEditDescription] = React.useState("")

  React.useEffect(() => {
    if (project) {
      setEditName(project.name)
      setEditClient(project.client)
      setEditBudget(project.budget ? String(project.budget) : "")
      setEditStatus(project.status)
      setEditColor(project.color || COLORS[0])
      setEditDescription(project.description || "")
    }
  }, [project?._id])

  async function handleSaveProject(e: React.FormEvent) {
    e.preventDefault()
    if (!project) return
    try {
      setSaving(true)
      await updateProject({
        projectId,
        name: editName.trim(),
        client: editClient.trim(),
        budget: editBudget ? parseFloat(editBudget) : undefined,
        status: editStatus,
        color: editColor,
        description: editDescription.trim() || undefined,
      })
      setEditing(false)
      toast.success(t("toasts.updated"))
    } catch (err: any) {
      toast.error(err?.message || tCommon("errorOccurred"))
    } finally {
      setSaving(false)
    }
  }

  // Quick-add expense
  const [showAddExpense, setShowAddExpense] = React.useState(false)
  const [expDesc, setExpDesc] = React.useState("")
  const [expAmount, setExpAmount] = React.useState("")
  const [expType, setExpType] = React.useState<"expense" | "income">("expense")
  const [expCategory, setExpCategory] = React.useState("Other")

  async function handleQuickAddExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!activeWorkspace?._id || !projectId) return
    try {
      await createExpense({
        workspaceId: activeWorkspace._id,
        projectId,
        description: expDesc.trim(),
        amount: parseFloat(expAmount),
        category: expCategory,
        date: Date.now(),
        paymentMethod: "Card",
        type: expType,
        currency,
      })
      setExpDesc(""); setExpAmount(""); setExpType("expense"); setExpCategory("Other")
      setShowAddExpense(false)
      toast.success(expType === "income" ? t("toasts.addedIncome") : t("toasts.addedExpense"))
    } catch (err: any) {
      toast.error(err?.message || tCommon("errorOccurred"))
    }
  }

  if (!project) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const budgetUsage = project.budget ? Math.min(100, ((project.spent || 0) / project.budget) * 100) : 0
  const totalIncome = (expenses ?? []).filter((e) => e.type === "income").reduce((a, b) => a + b.amount, 0)
  const totalExpense = (expenses ?? []).filter((e) => e.type === "expense").reduce((a, b) => a + b.amount, 0)

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href="/dashboard/projects"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="h-10 w-1.5 rounded-full" style={{ background: project.color || "#ccc" }} />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              <p className="text-xs text-muted-foreground">{project.client}</p>
            </div>
            <Badge variant="secondary" className={STATUS_COLORS[project.status]}>{t(`status.${project.status}`)}</Badge>
          </div>

          {project.description && (
            <p className="max-w-2xl text-sm text-muted-foreground">{project.description}</p>
          )}

          {project.startDate && (
            <p className="text-xs text-muted-foreground">
              {formatDate(project.startDate)} {project.endDate ? `→ ${formatDate(project.endDate)}` : ""}
            </p>
          )}
        </div>

        {/* Budget + Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {project.budget ? (
            <GlassCard className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("budget")}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-numeric text-2xl font-semibold">{formatCurrency(project.spent || 0, currency)}</span>
                <span className="text-sm text-muted-foreground">/ {formatCurrency(project.budget, currency)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div initial={{ width: 0 }} animate={{ width: `${budgetUsage}%` }} transition={{ duration: 0.6 }} className="h-full bg-accent" />
              </div>
            </GlassCard>
          ) : null}
          <GlassCard className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("stats.income")}</p>
            <p className="mt-2 font-numeric text-2xl font-semibold text-accent">{formatCurrency(totalIncome, currency)}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("stats.expenses")}</p>
            <p className="mt-2 font-numeric text-2xl font-semibold text-foreground">{formatCurrency(totalExpense, currency)}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("stats.net")}</p>
            <p className={`mt-2 font-numeric text-2xl font-semibold ${totalIncome - totalExpense >= 0 ? "text-accent" : "text-destructive"}`}>
              {formatCurrency(totalIncome - totalExpense, currency)}
            </p>
          </GlassCard>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions">
          <TabsList className="rounded-lg border border-border bg-card">
            <TabsTrigger value="transactions" className="gap-1"><Receipt className="h-3.5 w-3.5" /> {t("tabs.transactions")}</TabsTrigger>
            <TabsTrigger value="fiches" className="gap-1"><ClipboardList className="h-3.5 w-3.5" /> {t("tabs.fiches")}</TabsTrigger>
            <TabsTrigger value="documents" className="gap-1"><HardDrive className="h-3.5 w-3.5" /> {t("tabs.documents")}</TabsTrigger>
            <TabsTrigger value="details" className="gap-1"><FileText className="h-3.5 w-3.5" /> {t("tabs.details")}</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{t("tabs.transactions")}</h2>
              <Button size="sm" className="gap-1 rounded-full" onClick={() => setShowAddExpense(true)}>
                <Plus className="h-3.5 w-3.5" /> {tCommon("add")}
              </Button>
            </div>

            {showAddExpense && (
              <GlassCard className="p-4">
                <form onSubmit={handleQuickAddExpense} className="flex flex-wrap items-end gap-3">
                  <div className="flex gap-1">
                    {(["expense", "income"] as const).map((opt) => (
                      <button key={opt} type="button" onClick={() => setExpType(opt)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${expType === opt ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}>
                        {tCommon(opt)}
                      </button>
                    ))}
                  </div>
                  <Input value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder={t("quickAdd.descriptionPlaceholder")} className="h-8 text-sm w-64" required />
                  <Input type="number" step="0.01" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder={t("quickAdd.amountPlaceholder")} className="h-8 text-sm w-32 font-numeric" required />
                  <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="h-8 rounded-md border border-input bg-transparent px-2 text-xs">
                    {["Food", "Transport", "Housing", "Office", "Marketing", "Software", "Travel", "Salaries", "Taxes", "Utilities", "Other"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <Button type="submit" size="sm">{t("quickAdd.save")}</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddExpense(false)}>{t("quickAdd.cancel")}</Button>
                </form>
              </GlassCard>
            )}

            <GlassCard>
              {(expenses ?? []).length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">{t("empty.transactions")}</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {(expenses ?? []).map((e) => (
                    <li key={e._id} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/20">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${e.type === "income" ? "bg-accent/10 text-accent" : "bg-muted"}`}>
                          {e.type === "income" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{e.description}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(e.date)} · {e.category} · {e.paymentMethod}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 font-numeric text-sm font-medium ${e.type === "income" ? "text-accent" : "text-foreground"}`}>
                        {e.type === "income" ? "+" : "-"}{formatCurrency(e.amount, e.currency ?? currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="fiches" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{t("tabs.fiches")}</h2>
              <Button asChild size="sm" className="gap-1 rounded-full">
                <Link href={`/dashboard/fiches?project=${projectId}`}><Plus className="h-3.5 w-3.5" /> {t("tabs.fiches")}</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(fiches ?? []).length === 0 ? (
                <GlassCard className="p-5">
                  <p className="text-sm text-muted-foreground">{t("empty.fiches")}</p>
                </GlassCard>
              ) : (
                (fiches ?? []).map((f) => (
                  <Link key={f._id} href={`/dashboard/fiches/${f._id}`}>
                    <GlassCard className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <h3 className="text-base font-semibold hover:underline">{f.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{f.template} · {formatDate(f.updatedAt)}</p>
                    </GlassCard>
                  </Link>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 pt-4">
            <h2 className="text-sm font-semibold">{t("tabs.documents")}</h2>
            <GlassCard className="p-5">
              <AttachmentsField linkedTo={{ type: "project", id: projectId }} documentType="other" />
            </GlassCard>
            <GlassCard>
              {(docs ?? []).length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">{t("empty.documents")}</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {(docs ?? []).map((d) => (
                    <li key={d._id} className="flex items-center gap-3 px-5 py-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{d.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{d.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{t("tabs.details")}</h2>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>{tCommon("edit")}</Button>
              )}
            </div>
            {editing ? (
              <GlassCard className="p-5">
                <form onSubmit={handleSaveProject} className="space-y-4">
                  <div><Label>{tCommon("name")}</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>{tCommon("client")}</Label><Input value={editClient} onChange={(e) => setEditClient(e.target.value)} /></div>
                    <div><Label>{t("budget")} ({currency})</Label><Input type="number" step="0.01" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} /></div>
                  </div>
                  <div><Label>{tCommon("status")}</Label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                      <option value="planning">{t("status.planning")}</option>
                      <option value="active">{t("status.active")}</option>
                      <option value="on_hold">{t("status.on_hold")}</option>
                      <option value="completed">{t("status.completed")}</option>
                    </select>
                  </div>
                  <div><Label>{tCommon("description")}</Label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} /></div>
                  <div><Label>{t("color")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`h-7 w-7 rounded-full border-2 transition ${editColor === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tCommon("save")}</Button>
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>{tCommon("cancel")}</Button>
                  </div>
                </form>
              </GlassCard>
            ) : (
              <GlassCard className="p-5 space-y-3">
                <div><span className="text-xs text-muted-foreground">{tCommon("client")}</span><p className="text-sm font-medium">{project.client}</p></div>
                {project.budget ? <div><span className="text-xs text-muted-foreground">{t("budget")}</span><p className="text-sm font-medium">{formatCurrency(project.budget, currency)}</p></div> : null}
                <div><span className="text-xs text-muted-foreground">{tCommon("status")}</span><p className="text-sm font-medium capitalize">{project.status}</p></div>
                <div><span className="text-xs text-muted-foreground">{t("color")}</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full" style={{ background: project.color || "#ccc" }} />
                    <span className="text-sm text-muted-foreground">{project.color || tCommon("color")}</span>
                  </div>
                </div>
                {project.description ? <div><span className="text-xs text-muted-foreground">{tCommon("description")}</span><p className="text-sm">{project.description}</p></div> : null}
              </GlassCard>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
