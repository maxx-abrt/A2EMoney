"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useWorkspace } from "@/lib/workspace-context"
import { formatDate } from "@/lib/utils"
import { Activity, Loader2 } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export default function ActivityPage() {
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const activities = useQuery(api.activities.list, wsId ? { workspaceId: wsId, limit: 200 } : "skip")

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity log</h1>
          <p className="mt-1 text-sm text-muted-foreground">Immutable audit trail for this workspace.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card">
          {activities === undefined ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : activities.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" description="Workspace events will be logged here." />
          ) : (
            <ul className="divide-y divide-border">
              {activities.map((a: any) => (
                <li key={a._id} className="flex items-start gap-3 px-5 py-3 text-sm">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      <span className="font-medium">{a.actor?.name ?? a.actor?.email ?? "Someone"}</span>{" "}
                      <span className="text-muted-foreground">{a.action.replace(/_/g, " ").replace(/\./g, " ")}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.createdAt)} · {a.targetType}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
