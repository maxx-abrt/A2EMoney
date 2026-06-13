"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useWorkspace } from "@/lib/workspace-context"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { GlassCard } from "@/components/glass-card"
import { Plus, People, Trash2, Loader2, ReceiptText, Wallet3, Search } from "@/components/iconsax"
import { toast } from "sonner"

export default function ClientsPage() {
  const t = useTranslations("pages.clients")
  const tCommon = useTranslations("common")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const currency = activeWorkspace?.currency ?? "EUR"

  const clients = useQuery(api.a2e_clients.list, wsId ? { workspaceId: wsId } : "skip")
  const invoices = useQuery(api.a2e_invoices.list, wsId ? { workspaceId: wsId } : "skip")
  const create = useMutation(api.a2e_clients.create)
  const remove = useMutation(api.a2e_clients.remove)

  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [siret, setSiret] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const filtered = React.useMemo(() => {
    if (!query.trim()) return clients ?? []
    const q = query.toLowerCase()
    return (clients ?? []).filter((c) => c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.siret || "").includes(q))
  }, [clients, query])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!wsId || !name.trim()) return
    try {
      setSaving(true)
      await create({
        workspaceId: wsId,
        name: name.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        siret: siret.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      toast.success(t("toasts.created"))
      setOpen(false)
      setName(""); setEmail(""); setAddress(""); setSiret(""); setPhone(""); setNotes("")
    } catch (err: any) {
      toast.error(err?.message || t("toasts.failed"))
    } finally {
      setSaving(false)
    }
  }

  const clientInvoiceStats = React.useMemo(() => {
    const m = new Map<string, { count: number; total: number; paid: number }>()
    for (const inv of invoices ?? []) {
      if (!inv.linkedClientId) continue
      const s = m.get(inv.linkedClientId) ?? { count: 0, total: 0, paid: 0 }
      s.count++
      const total = inv.items.reduce((a, b) => a + b.quantity * b.unitPrice, 0)
      s.total += total
      if (inv.status === "paid") s.paid += total
      m.set(inv.linkedClientId, s)
    }
    return m
  }, [invoices])

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2 rounded-full shadow-sm"><Plus className="h-4 w-4" /> {t("new")}</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>{t("new")}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-5">
                <div><Label>{tCommon("name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <div><Label>{t("phone")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                </div>
                <div><Label>{t("address")}</Label><Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} /></div>
                <div><Label>SIRET</Label><Input value={siret} onChange={(e) => setSiret(e.target.value)} /></div>
                <div><Label>{tCommon("notes")}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tCommon("cancel")}</Button>
                  <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tCommon("create")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("searchPlaceholder")} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>

        {clients === undefined ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <GlassCard><EmptyState icon={People} title={t("empty.title")} description={t("empty.description")} action={{ onClick: () => setOpen(true), label: t("new") }} /></GlassCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, idx) => {
              const stats = clientInvoiceStats.get(c._id)
              return (
                <motion.div key={c._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * idx }}>
                  <GlassCard className="group p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold">{c.name}</h3>
                        {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                        {c.siret && <Badge variant="outline" className="mt-1 text-[10px]">SIRET {c.siret}</Badge>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 transition-opacity group-hover:opacity-100" onClick={() => remove({ clientId: c._id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {stats && (
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md bg-muted/40 p-2">
                          <div className="flex items-center gap-1 text-muted-foreground"><ReceiptText className="h-3 w-3" /> {t("invoices")}</div>
                          <p className="mt-1 font-semibold">{stats.count}</p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-2">
                          <div className="flex items-center gap-1 text-muted-foreground"><Wallet3 className="h-3 w-3" /> {t("totalPaid")}</div>
                          <p className="mt-1 font-semibold">{formatCurrency(stats.paid, currency)}</p>
                        </div>
                      </div>
                    )}
                    {c.address && <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{c.address}</p>}
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
