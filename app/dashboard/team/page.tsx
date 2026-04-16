"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { workspacesAPI } from "@/lib/api-client"
import { toast } from "sonner"
import {
  Building2,
  Copy,
  Crown,
  Mail,
  MoreVertical,
  Plus,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Role = "owner" | "admin" | "member" | "viewer"

interface Member {
  id: string
  role: Role
  joinedAt: string
  user: { id: string; email: string; name: string | null; avatar: string | null }
}

interface Invitation {
  id: string
  email: string
  role: Role
  token: string
  status: "pending" | "accepted" | "revoked" | "expired"
  expiresAt: string
  createdAt: string
}

interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  avatar: string | null
  ownerId: string
  storageQuota: number
  memberships: Member[]
  invitations: Invitation[]
  createdAt: string
}

const TEMP_USER_ID = "temp-user-id"

const ROLE_TONE: Record<Role, string> = {
  owner: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  admin: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  member: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  viewer: "bg-muted text-muted-foreground",
}

const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  owner: Crown,
  admin: Shield,
  member: Users,
  viewer: Eye,
}

export default function TeamPage() {
  const t = useTranslations("team")
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState({ name: "", description: "" })
  const [newInvite, setNewInvite] = useState<{ email: string; role: Role }>({
    email: "",
    role: "member",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = (await workspacesAPI.getAll()) as Workspace[]
      setWorkspaces(Array.isArray(data) ? data : [])
      if (!activeId && data?.[0]?.id) setActiveId(data[0].id)
    } catch {
      setWorkspaces([])
    } finally {
      setLoading(false)
    }
  }, [activeId])

  useEffect(() => {
    void load()
  }, [load])

  const active = useMemo(
    () => workspaces.find(w => w.id === activeId) ?? null,
    [workspaces, activeId],
  )

  const myRole: Role | null = useMemo(() => {
    if (!active) return null
    if (active.ownerId === TEMP_USER_ID) return "owner"
    const m = active.memberships.find(m => m.user.id === TEMP_USER_ID)
    return (m?.role ?? null) as Role | null
  }, [active])

  const canManage = myRole === "owner" || myRole === "admin"

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) return
    try {
      const created = (await workspacesAPI.create(newWorkspace)) as Workspace
      await load()
      setActiveId(created.id)
      setNewWorkspace({ name: "", description: "" })
      setCreateOpen(false)
      toast.success(t("toasts.workspaceCreated"))
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("toasts.workspaceCreateFailed"),
      )
    }
  }

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return
    try {
      await workspacesAPI.delete(id)
      await load()
      setActiveId(workspaces.find(w => w.id !== id)?.id ?? null)
      toast.success(t("toasts.workspaceDeleted"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  const handleInvite = async () => {
    if (!active || !newInvite.email.trim()) return
    try {
      await workspacesAPI.invite(active.id, newInvite.email.trim(), newInvite.role)
      await load()
      setNewInvite({ email: "", role: "member" })
      setInviteOpen(false)
      toast.success(t("toasts.invitationSent", { email: newInvite.email }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed")
    }
  }

  const handleRevokeInvite = async (invitationId: string) => {
    if (!active) return
    try {
      await workspacesAPI.revokeInvitation(active.id, invitationId)
      await load()
      toast.success(t("toasts.invitationRevoked"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Revoke failed")
    }
  }

  const handleChangeRole = async (userId: string, role: Role) => {
    if (!active) return
    try {
      await workspacesAPI.updateMember(active.id, userId, role)
      await load()
      toast.success(t("toasts.roleUpdated"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Role change failed")
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!active) return
    if (!confirm(t("confirmRemoveMember"))) return
    try {
      await workspacesAPI.removeMember(active.id, userId)
      await load()
      toast.success(t("toasts.memberRemoved"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed")
    }
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(link)
    toast.success(t("toasts.linkCopied"))
  }

  const pendingInvitations = useMemo(
    () => (active?.invitations ?? []).filter(i => i.status === "pending"),
    [active],
  )

  return (
    <div className="space-y-8 p-4 sm:p-8">
      {/* Header */}
      <div className="animate-fade-up flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              {t("newWorkspace")}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-xl border">
            <DialogHeader>
              <DialogTitle className="font-semibold">
                {t("newWorkspace")}
              </DialogTitle>
              <DialogDescription>{t("newWorkspaceDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="font-medium">{t("workspaceName")}</Label>
                <Input
                  className="rounded-lg border"
                  placeholder={t("workspaceNamePlaceholder")}
                  value={newWorkspace.name}
                  onChange={e =>
                    setNewWorkspace({ ...newWorkspace, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">
                  {t("workspaceDescription")}{" "}
                  <span className="text-muted-foreground">({t("optional")})</span>
                </Label>
                <Textarea
                  className="rounded-lg border"
                  placeholder={t("workspaceDescriptionPlaceholder")}
                  value={newWorkspace.description}
                  onChange={e =>
                    setNewWorkspace({
                      ...newWorkspace,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border font-medium"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleCreateWorkspace}
                className="shadow-sm font-semibold"
              >
                {t("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

      {!loading && workspaces.length === 0 && (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t("emptyTitle")}</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {t("emptyDescription")}
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              {t("createFirstWorkspace")}
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && workspaces.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Workspaces sidebar */}
          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm font-semibold">
                {t("yourWorkspaces")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {workspaces.map(ws => {
                  const isActive = ws.id === activeId
                  const memberCount = ws.memberships.length
                  return (
                    <button
                      key={ws.id}
                      onClick={() => setActiveId(ws.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        isActive
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-semibold text-xs",
                          isActive
                            ? "bg-background/10 text-background"
                            : "bg-accent/10 text-accent",
                        )}
                      >
                        {ws.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {ws.name}
                        </div>
                        <div
                          className={cn(
                            "truncate text-xs",
                            isActive
                              ? "text-background/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {t("memberCount", { count: memberCount })}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active workspace detail */}
          {active && (
            <div className="space-y-6">
              {/* Header card */}
              <Card className="rounded-xl border shadow-sm">
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent text-lg font-semibold">
                      {active.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">{active.name}</h2>
                        {myRole && (
                          <Badge
                            className={cn(
                              "rounded-full border-0 px-2 py-0.5 text-xs font-medium capitalize",
                              ROLE_TONE[myRole],
                            )}
                          >
                            {t(`roles.${myRole}`)}
                          </Badge>
                        )}
                      </div>
                      {active.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {active.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("workspaceSlug", { slug: active.slug })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canManage && (
                      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                          <Button className="shadow-sm font-semibold">
                            <UserPlus className="mr-2 h-4 w-4" />
                            {t("invite")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-xl border">
                          <DialogHeader>
                            <DialogTitle className="font-semibold">
                              {t("inviteMember")}
                            </DialogTitle>
                            <DialogDescription>
                              {t("inviteDescription")}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="font-medium">{t("email")}</Label>
                              <Input
                                type="email"
                                className="rounded-lg border"
                                placeholder="teammate@example.com"
                                value={newInvite.email}
                                onChange={e =>
                                  setNewInvite({
                                    ...newInvite,
                                    email: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-medium">{t("role")}</Label>
                              <Select
                                value={newInvite.role}
                                onValueChange={v =>
                                  setNewInvite({
                                    ...newInvite,
                                    role: v as Role,
                                  })
                                }
                              >
                                <SelectTrigger className="rounded-lg border">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border">
                                  <SelectItem value="admin">
                                    {t("roles.admin")}
                                  </SelectItem>
                                  <SelectItem value="member">
                                    {t("roles.member")}
                                  </SelectItem>
                                  <SelectItem value="viewer">
                                    {t("roles.viewer")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                {t(`roleHint.${newInvite.role}`)}
                              </p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setInviteOpen(false)}
                              className="rounded-lg border font-medium"
                            >
                              {t("cancel")}
                            </Button>
                            <Button
                              onClick={handleInvite}
                              className="shadow-sm font-semibold"
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              {t("sendInvitation")}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    {myRole === "owner" && (
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteWorkspace(active.id)}
                        className="rounded-lg border font-medium text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Members */}
              <Card className="rounded-xl border shadow-sm">
                <CardHeader className="border-b border-border">
                  <CardTitle className="font-semibold">{t("members")}</CardTitle>
                  <CardDescription>
                    {t("memberCount", { count: active.memberships.length })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {active.memberships.map(m => {
                      const RoleIcon = ROLE_ICON[m.role]
                      const isOwner = active.ownerId === m.user.id
                      const canEditThis = canManage && !isOwner
                      return (
                        <li
                          key={m.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-semibold text-sm">
                              {(m.user.name ?? m.user.email).slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold">
                                  {m.user.name ?? m.user.email}
                                </span>
                                {m.user.id === TEMP_USER_ID && (
                                  <Badge
                                    variant="outline"
                                    className="rounded-full px-2 py-0 text-[10px]"
                                  >
                                    {t("you")}
                                  </Badge>
                                )}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {m.user.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                "flex items-center gap-1 rounded-full border-0 px-2.5 py-1 text-xs font-medium capitalize",
                                ROLE_TONE[m.role],
                              )}
                            >
                              <RoleIcon className="h-3 w-3" />
                              {t(`roles.${m.role}`)}
                            </Badge>
                            {canEditThis && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleChangeRole(m.user.id, "admin")
                                    }
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    {t("makeAdmin")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleChangeRole(m.user.id, "member")
                                    }
                                  >
                                    <Users className="mr-2 h-4 w-4" />
                                    {t("makeMember")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleChangeRole(m.user.id, "viewer")
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t("makeViewer")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveMember(m.user.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    {t("remove")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>

              {/* Pending invitations */}
              {canManage && (
                <Card className="rounded-xl border shadow-sm">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="font-semibold">
                      {t("pendingInvitations")}
                    </CardTitle>
                    <CardDescription>
                      {t("invitationCount", { count: pendingInvitations.length })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {pendingInvitations.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Mail className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium">
                          {t("noInvitationsTitle")}
                        </p>
                        <p className="max-w-sm text-xs text-muted-foreground">
                          {t("noInvitationsDescription")}
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-border">
                        {pendingInvitations.map(inv => {
                          const expired = new Date(inv.expiresAt) < new Date()
                          return (
                            <li
                              key={inv.id}
                              className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                                  <Mail className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold">
                                    {inv.email}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    {expired ? (
                                      <>
                                        <XCircle className="h-3 w-3 text-destructive" />
                                        {t("invitationExpired")}
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="h-3 w-3" />
                                        {t("invitationExpiresAt", {
                                          date: new Date(
                                            inv.expiresAt,
                                          ).toLocaleDateString(),
                                        })}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={cn(
                                    "rounded-full border-0 px-2 py-0.5 text-xs capitalize",
                                    ROLE_TONE[inv.role],
                                  )}
                                >
                                  {t(`roles.${inv.role}`)}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => copyInviteLink(inv.token)}
                                  title={t("copyInviteLink")}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRevokeInvite(inv.id)}
                                  title={t("revoke")}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* GDPR notice */}
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-medium text-foreground">{t("gdprTitle")}</p>
                  <p className="mt-0.5 leading-relaxed">{t("gdprDescription")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
