"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { useConvexAuth } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

const STORAGE_KEY = "a2e_active_workspace"

type WorkspaceMembership = {
  _id: Id<"workspaces">
  name: string
  slug: string
  avatar?: string
  description?: string
  role: string
  storageQuota: number
  locale?: string
  currency?: string
  type?: string
  ownerId: Id<"users">
  memberCount: number
}

interface WorkspaceContextValue {
  workspaces: WorkspaceMembership[] | undefined
  activeWorkspaceId: Id<"workspaces"> | null
  activeWorkspace: WorkspaceMembership | null
  setActiveWorkspaceId: (id: Id<"workspaces"> | null) => void
  isLoading: boolean
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const workspaces = useQuery(
    api.workspaces.listMine,
    isAuthenticated ? {} : "skip",
  ) as WorkspaceMembership[] | undefined

  const [activeId, setActiveIdState] = React.useState<Id<"workspaces"> | null>(
    null,
  )

  // Hydrate from localStorage on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) setActiveIdState(stored as Id<"workspaces">)
  }, [])

  // Validate active id against memberships, else fall back to first one
  React.useEffect(() => {
    if (!workspaces) return
    if (workspaces.length === 0) {
      setActiveIdState(null)
      return
    }
    if (!activeId || !workspaces.find((w) => w._id === activeId)) {
      setActiveIdState(workspaces[0]._id)
    }
  }, [workspaces, activeId])

  // Persist
  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (activeId) window.localStorage.setItem(STORAGE_KEY, activeId)
    else window.localStorage.removeItem(STORAGE_KEY)
  }, [activeId])

  const setActiveWorkspaceId = React.useCallback(
    (id: Id<"workspaces"> | null) => setActiveIdState(id),
    [],
  )

  const activeWorkspace = React.useMemo(
    () => workspaces?.find((w) => w._id === activeId) ?? null,
    [workspaces, activeId],
  )

  const value: WorkspaceContextValue = {
    workspaces,
    activeWorkspaceId: activeId,
    activeWorkspace,
    setActiveWorkspaceId,
    isLoading: authLoading || (isAuthenticated && workspaces === undefined),
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = React.useContext(WorkspaceContext)
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider")
  return ctx
}
