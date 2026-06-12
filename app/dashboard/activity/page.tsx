"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useWorkspace } from "@/lib/workspace-context"
import { formatDate } from "@/lib/utils"
import { Activity, Loader2 } from "@/components/iconsax"
import { EmptyState } from "@/components/empty-state"
import { GlassCard } from "@/components/glass-card"

export default function ActivityPage() {
  const t = useTranslations("pages.activity")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const activities = useQuery(api.activities.list, wsId ? { workspaceId: wsId, limit: 200 } : "skip")

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
            <ul className="divide-y divide-border/60">
              {activities.map((a: any, idx: number) => (
                <motion.li key={a._id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.01 * idx }}
                  className="flex items-start gap-3 px-5 py-3 text-sm">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      <span className="font-medium">{a.actor?.name ?? a.actor?.email ?? "—"}</span>{" "}
                      <span className="text-muted-foreground">{a.action.replace(/_/g, " ").replace(/\./g, " ")}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.createdAt)} · {a.targetType}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
