"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { useConvexAuth } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Loader2, Wallet, CheckCircle2 } from "@/components/iconsax"
import { useWorkspace } from "@/lib/workspace-context"
import { toast } from "sonner"

export default function InviteAcceptPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const invitation = useQuery(api.invitations.getByToken, { token: params.token })
  const accept = useMutation(api.invitations.accept)
  const { setActiveWorkspaceId } = useWorkspace()
  const [accepting, setAccepting] = React.useState(false)

  async function handleAccept() {
    try {
      setAccepting(true)
      const wsId = await accept({ token: params.token })
      setActiveWorkspaceId(wsId)
      toast.success("Joined workspace!")
      router.push("/dashboard")
    } catch (err: any) {
      toast.error(err?.message || "Could not accept invitation")
    } finally {
      setAccepting(false)
    }
  }

  if (isLoading || invitation === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Invitation not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This invitation does not exist or has been revoked.</p>
          <Button asChild className="mt-6"><a href="/">Go home</a></Button>
        </div>
      </div>
    )
  }

  if (invitation.status !== "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Invitation {invitation.status}</h1>
          <p className="mt-2 text-sm text-muted-foreground">This invitation is no longer valid.</p>
          <Button asChild className="mt-6"><a href="/dashboard">Go to dashboard</a></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Wallet className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">You're invited to join</h1>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{invitation.workspace?.name ?? "a workspace"}</p>
        <p className="mt-3 text-sm text-muted-foreground">As a <strong>{invitation.role}</strong>, you'll be able to collaborate on this workspace.</p>
        {isAuthenticated ? (
          <Button onClick={handleAccept} disabled={accepting} className="mt-6 w-full gap-2">
            {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Accept invitation
          </Button>
        ) : (
          <Button asChild className="mt-6 w-full">
            <a href={`/auth?next=${encodeURIComponent(`/invite/${params.token}`)}`}>Sign in to accept</a>
          </Button>
        )}
      </div>
    </div>
  )
}
