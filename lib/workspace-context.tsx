"use client"

import * as React from "react"
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react"
import {
  WorkspaceProvider as CoreWorkspaceProvider,
  useWorkspace as useCoreWorkspace,
  useCoreMutation,
  coreApi,
} from "@a2e/core"
import { api } from "@/convex/_generated/api"

/**
 * Workspace state — powered by A2E Core (shared across the suite).
 *
 * The public interface of this module is unchanged (workspaces,
 * activeWorkspace(Id), setActiveWorkspaceId, isLoading), so all existing
 * components keep working — but the workspace ids are now CORE workspace ids
 * (strings), shared with Bureau and every other suite app.
 *
 * This bridge also performs the one-shot legacy migration automatically:
 *  - legacy local workspaces owned by the current user get a core workspace
 *    created and all their app data repointed (`migrations.claim`);
 *  - memberships in already-migrated workspaces are imported into core
 *    (`migrations.joinCore`);
 *  - the server-verified membership mirror is refreshed (`sync.syncFromCore`).
 */

type WorkspaceMembership = {
  _id: string
  name: string
  slug: string
  avatar?: string
  description?: string
  role: string
  storageQuota: number
  locale?: string
  currency?: string
  type?: string
  ownerId: string
  memberCount: number
}

interface WorkspaceContextValue {
  workspaces: WorkspaceMembership[] | undefined
  activeWorkspaceId: string | null
  activeWorkspace: WorkspaceMembership | null
  setActiveWorkspaceId: (id: string | null) => void
  isLoading: boolean
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null)

function MigrationBridge() {
  const { isAuthenticated } = useConvexAuth()
  const { workspaces } = useCoreWorkspace()
  const myLegacy = useQuery(api.migrations.myLegacy, isAuthenticated ? {} : "skip")
  const claim = useMutation(api.migrations.claim)
  const joinCore = useAction(api.migrations.joinCore)
  const migrateDocuments = useAction(api.migrations.migrateDocuments)
  const syncFromCore = useAction(api.sync.syncFromCore)
  const createCoreWorkspace = useCoreMutation(coreApi.workspaces.create)

  // Keep the server-side membership mirror fresh whenever the core
  // workspace set changes.
  const coreIds = (workspaces ?? []).map((w) => w._id).join(",")
  React.useEffect(() => {
    if (!isAuthenticated || !workspaces) return
    syncFromCore().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, coreIds])

  // One-shot legacy → core migration (idempotent).
  const running = React.useRef(false)
  React.useEffect(() => {
    if (!myLegacy || myLegacy.length === 0 || running.current) return
    running.current = true
    ;(async () => {
      try {
        for (const w of myLegacy) {
          if (!w.coreId && w.role === "owner") {
            const coreId = await createCoreWorkspace({ name: w.name })
            await claim({ localId: w.localId, coreId })
            // Backfill legacy documents into the core drive (B2 untouched).
            await migrateDocuments({ workspaceId: coreId })
          } else if (w.coreId) {
            await joinCore({ localId: w.localId })
            await migrateDocuments({ workspaceId: w.coreId })
          }
        }
        await syncFromCore().catch(() => {})
      } catch (err) {
        console.error("Workspace migration failed (will retry next load):", err)
      } finally {
        running.current = false
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myLegacy])

  return null
}

function Bridge({ children }: { children: React.ReactNode }) {
  const core = useCoreWorkspace()
  const value: WorkspaceContextValue = {
    workspaces: core.workspaces as WorkspaceMembership[] | undefined,
    activeWorkspaceId: (core.activeWorkspaceId as string | null) ?? null,
    activeWorkspace: (core.activeWorkspace as WorkspaceMembership | null) ?? null,
    setActiveWorkspaceId: (id) => core.setActiveWorkspaceId(id as any),
    isLoading: core.isLoading,
  }
  return (
    <WorkspaceContext.Provider value={value}>
      <MigrationBridge />
      {children}
    </WorkspaceContext.Provider>
  )
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  return (
    <CoreWorkspaceProvider>
      <Bridge>{children}</Bridge>
    </CoreWorkspaceProvider>
  )
}

export function useWorkspace() {
  const ctx = React.useContext(WorkspaceContext)
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider")
  return ctx
}
