"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useWorkspace } from "@/lib/workspace-context"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Loader2,
  ReceiptText,
  FileText,
  FolderOpen,
  Wallet3,
  Book1,
  ClipboardText,
  People,
  Judge,
  Chart,
  HardDrive,
  Trash2,
  TickCircle,
  NoteAdd,
  MoneySend,
} from "@/components/iconsax"
import { EmptyState } from "@/components/empty-state"
import { GlassCard } from "@/components/glass-card"

const ACTION_ICONS: Record<string, any> = {
  "expense.created": ReceiptText,
  "expense.updated": ReceiptText,
  "expense.deleted": Trash2,
  "income.created": MoneySend,
  "invoice.created": FileText,
  "invoice.updated": FileText,
  "invoice.deleted": Trash2,
  "project.created": FolderOpen,
  "project.updated": FolderOpen,
  "project.deleted": Trash2,
  "budget.created": Wallet3,
  "budget.updated": Wallet3,
  "budget.deleted": Trash2,
  "book.sheet_created": Book1,
  "book.sheet_updated": Book1,
  "book.sheet_deleted": Trash2,
  "book.entry_created": NoteAdd,
  "fiche.created": ClipboardText,
  "fiche.updated": ClipboardText,
  "fiche.deleted": Trash2,
  "client.created": People,
  "client.updated": People,
  "client.deleted": Trash2,
  "grantReport.created": Chart,
  "grantReport.updated": Chart,
  "grantReport.deleted": Trash2,
  "document.uploaded": HardDrive,
  "document.deleted": Trash2,
  "task.created": TickCircle,
  "task.completed": TickCircle,
  "workspace.created": Judge,
  "workspace.updated": Judge,
  "member.invited": People,
}

const ACTION_COLORS: Record<string, string> = {
  "expense.created": "bg-muted text-foreground",
  "income.created": "bg-accent/10 text-accent",
  "invoice.created": "bg-blue-500/10 text-blue-600",
  "invoice.updated": "bg-blue-500/10 text-blue-600",
  "project.created": "bg-purple-500/10 text-purple-600",
  "budget.created": "bg-amber-500/10 text-amber-600",
  "book.sheet_created": "bg-emerald-500/10 text-emerald-600",
  "fiche.created": "bg-fuchsia-500/10 text-fuchsia-600",
  "client.created": "bg-cyan-500/10 text-cyan-600",
  "grantReport.created": "bg-rose-500/10 text-rose-600",
  "task.completed": "bg-accent/10 text-accent",
  "member.invited": "bg-indigo-500/10 text-indigo-600",
}

function getActionLink(a: any): string | undefined {
  const type = a.targetType
  const id = a.targetId
  if (type === "expense") return `/dashboard/expenses`
  if (type === "invoice") return `/dashboard/invoices`
  if (type === "project") return `/dashboard/projects/${id}`
  if (type === "budget") return `/dashboard/budget`
  if (type === "book_sheet" || type === "book_entry") return `/dashboard/book`
  if (type === "fiche") return `/dashboard/fiches/${id}`
  if (type === "client") return `/dashboard/clients`
  if (type === "grantReport") return `/dashboard/projects/${a.metadata?.projectId}/cerfa/${id}`
  return undefined
}

function groupByDay(activities: any[]) {
  const groups = new Map<string, any[]>()
  for (const a of activities) {
    const d = new Date(a.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(a)
  }
  return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
}

export default function ActivityPage() {
  const t = useTranslations("pages.activity")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const activities = useQuery(api.activities.list, wsId ? { workspaceId: wsId, limit: 200 } : "skip")

  const grouped = React.useMemo(() => {
    return groupByDay(activities ?? [])
  }, [activities])

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <GlassCard>
          {activities === undefined ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : activities.length === 0 ? (
            <EmptyState icon={Activity} title={t("empty.title")} description={t("empty.description")} />
          ) : (
            <div className="divide-y divide-border/60">
              {grouped.map(([day, items]) => (
                <div key={day} className="px-5 py-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {formatDate(new Date(day).getTime())}
                  </h3>
                  <ul className="space-y-3">
                    {items.map((a: any, idx: number) => {
                      const Icon = ACTION_ICONS[a.action] || Activity
                      const color = ACTION_COLORS[a.action] || "bg-muted text-muted-foreground"
                      const link = getActionLink(a)
                      return (
                        <motion.li
                          key={a._id}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.01 * idx }}
                          className="flex items-start gap-3 text-sm"
                        >
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate">
                              <span className="font-medium">{a.actor?.name ?? a.actor?.email ?? "—"}</span>{" "}
                              <span className="text-muted-foreground">{a.action.replace(/_/g, " ").replace(/\./g, " ")}</span>
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{a.targetType}</Badge>
                              {link && (
                                <Link href={link} className="text-xs text-accent hover:underline">
                                  View →
                                </Link>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </motion.li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
