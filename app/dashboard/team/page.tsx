"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useWorkspace } from "@/lib/workspace-context"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/empty-state"
import { People as Users, UserAdd, Refresh as Loader2, MoreCircle as MoreHorizontal, Copy, ShieldTick as ShieldCheck, Danger as ShieldAlert, Eye, ProfileTick as UserCheck, CloseCircle as XCircle } from "@/components/iconsax"
import { toast } from "sonner"

const ROLES = ["admin", "member", "viewer"] as const
const UserPlus = UserAdd

export default function TeamPage() {
  const t = useTranslations("team")
  const tCommon = useTranslations("common")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id
  const me = useQuery(api.users.me, {})

  const members = useQuery(api.workspaces.listMembers, wsId ? { workspaceId: wsId } : "skip")
  const invitations = useQuery(api.invitations.listByWorkspace, wsId ? { workspaceId: wsId } : "skip")
  const invite = useMutation(api.invitations.invite)
  const revoke = useMutation(api.invitations.revoke)
  const updateRole = useMutation(api.workspaces.updateMemberRole)
  const removeMember = useMutation(api.workspaces.removeMember)

  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<"admin" | "member" | "viewer">("member")
  const [inviting, setInviting] = React.useState(false)

  const canManage = activeWorkspace?.role === "owner" || activeWorkspace?.role === "admin"

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!wsId || !email.trim()) return
    try {
      setInviting(true)
      const res = await invite({ workspaceId: wsId, email: email.trim(), role })
      const link = `${window.location.origin}/invite/${res.token}`
      await navigator.clipboard.writeText(link).catch(() => {})
      toast.success(t("toasts.invitationSent", { email: email.trim() }))
      toast(t("toasts.linkCopied"))
      setEmail("")
      setInviteOpen(false)
    } catch (err: any) {
      toast.error(err?.message || "Could not send invitation")
    } finally {
      setInviting(false)
    }
  }

  async function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`
    await navigator.clipboard.writeText(link)
    toast.success(t("toasts.linkCopied"))
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
          </div>
          {canManage && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><UserPlus className="h-4 w-4" /> {t("invite")}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("inviteMember")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="flex min-h-0 flex-1 flex-col">
                  <DialogBody className="space-y-4 px-1">
                    <div>
                      <Label>{t("email")}</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                      <Label>{t("role")}</Label>
                      <select value={role} onChange={(e) => setRole(e.target.value as any)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                        {ROLES.map((r) => (<option key={r} value={r}>{t(`roles.${r}`)}</option>))}
                      </select>
                      <p className="mt-1 text-xs text-muted-foreground">{t(`roleHint.${role}`)}</p>
                    </div>
                  </DialogBody>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>{tCommon("cancel")}</Button>
                    <Button type="submit" disabled={inviting || !email.trim()}>{inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("sendInvitation")}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Members */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">{t("members")}</h2>
          </div>
          {members === undefined ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : members.length === 0 ? (
            <EmptyState icon={Users} title={t("emptyTitle")} description={t("emptyDescription")} />
          ) : (
            <ul className="divide-y divide-border">
              {members.map((m) => {
                const isMe = me?._id === m.userId
                return (
                  <li key={m._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-sm font-medium text-primary">
                      {m.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (m.name || m.email || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {m.name || m.email || "—"} {isMe && <span className="ml-1 text-xs text-muted-foreground">({t("you")})</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{m.email || ""}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{t(`roles.${m.role}`)}</Badge>
                    {canManage && !isMe && m.role !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateRole({ workspaceId: wsId!, memberId: m._id, role: "admin" })}><ShieldCheck className="mr-2 h-4 w-4" /> {t("makeAdmin")}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateRole({ workspaceId: wsId!, memberId: m._id, role: "member" })}><UserCheck className="mr-2 h-4 w-4" /> {t("makeMember")}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateRole({ workspaceId: wsId!, memberId: m._id, role: "viewer" })}><Eye className="mr-2 h-4 w-4" /> {t("makeViewer")}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => {
                            if (confirm(t("confirmRemoveMember"))) removeMember({ workspaceId: wsId!, memberId: m._id })
                          }}><XCircle className="mr-2 h-4 w-4" /> {t("remove")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Invitations */}
        {canManage && (
          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">{t("pendingInvitations")}</h2>
            </div>
            {!invitations || invitations.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-muted-foreground">{t("noInvitationsTitle")}</div>
            ) : (
              <ul className="divide-y divide-border">
                {invitations.filter((i) => i.status === "pending").map((inv) => (
                  <li key={inv._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><UserPlus className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">{t("invitationExpiresAt", { date: formatDate(inv.expiresAt) })}</p>
                    </div>
                    <Badge variant="secondary">{t(`roles.${inv.role}`)}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => copyInviteLink(inv.token)} className="gap-1"><Copy className="h-3.5 w-3.5" /> {t("copyInviteLink")}</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => revoke({ invitationId: inv._id })}>{t("revoke")}</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">{t("gdprTitle")}</h2>
          <p className="mt-2 text-xs text-muted-foreground">{t("gdprDescription")}</p>
        </div>
      </div>
    </div>
  )
}
