"use client"

import * as React from "react"
import Link from "next/link"
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/empty-state"
import { Plus, FolderOpen, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

const STATUSES = [
  { id: "planning", label: "Planning", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "active", label: "Active", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { id: "on_hold", label: "On hold", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  { id: "completed", label: "Completed", color: "bg-muted text-muted-foreground" },
] as const

export default function ProjectsPage() {
  const t = useTranslations("common")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const currency = activeWorkspace?.currency ?? "EUR"

  const projects = useQuery(api.projects.list, wsId ? { workspaceId: wsId } : "skip")
  const create = useMutation(api.projects.create)
  const remove = useMutation(api.projects.remove)

  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [client, setClient] = React.useState("")
  const [budget, setBudget] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [status, setStatus] = React.useState<"planning" | "active" | "on_hold" | "completed">("planning")
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!wsId) return
    try {
      setSaving(true)
      await create({
        workspaceId: wsId,
        name: name.trim(),
        client: client.trim() || "Internal",
        status,
        budget: budget ? parseFloat(budget) : undefined,
        description: description.trim() || undefined,
        startDate: startDate ? new Date(startDate).getTime() : undefined,
        endDate: endDate ? new Date(endDate).getTime() : undefined,
      })
      toast.success("Project created")
      setOpen(false)
      setName(""); setClient(""); setBudget(""); setDescription(""); setEndDate("")
    } catch (err: any) {
      toast.error(err?.message || "Could not save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Shared across the A2E Suite. Link invoices, expenses, and books.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label>{t("name")}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("client")}</Label>
                    <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Acme Inc." />
                  </div>
                  <div>
                    <Label>Budget ({currency})</Label>
                    <Input type="number" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>End date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>{t("status")}</Label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label>{t("description")}</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
                  <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("create")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {projects === undefined ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card">
            <EmptyState
              icon={FolderOpen}
              title="No projects yet"
              description="Create a project to group invoices, expenses and tasks."
              action={{ onClick: () => setOpen(true), label: "New project" }}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const statusObj = STATUSES.find((s) => s.id === p.status) ?? STATUSES[0]
              const budgetUsage = p.budget ? Math.min(100, ((p.spent || 0) / p.budget) * 100) : 0
              return (
                <div key={p._id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold">{p.name}</h3>
                      <p className="truncate text-xs text-muted-foreground">{p.client}</p>
                    </div>
                    <Badge variant="secondary" className={statusObj.color}>{statusObj.label}</Badge>
                  </div>
                  {p.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                  {p.budget ? (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-medium">{formatCurrency(p.spent || 0, currency)} / {formatCurrency(p.budget, currency)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-accent" style={{ width: `${budgetUsage}%` }} />
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.startDate ? formatDate(p.startDate) : "—"}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove({ projectId: p._id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
