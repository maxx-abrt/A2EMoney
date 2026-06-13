"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { api } from "@/convex/_generated/api"
import { useWorkspace } from "@/lib/workspace-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GlassCard } from "@/components/glass-card"
import { LogoutCurve, Save2, Trash, Danger, DocumentDownload } from "@/components/iconsax"
import { toast } from "sonner"
import { exportToJSON } from "@/lib/export"

export default function SettingsPage() {
  const t = useTranslations("pages.settings")
  const tCommon = useTranslations("common")
  const { signOut } = useAuthActions()
  const { activeWorkspace, setActiveWorkspaceId } = useWorkspace()
  const wsId = activeWorkspace?._id
  const me = useQuery(api.users.me, {})
  const updateUser = useMutation(api.users.updateProfile)
  const updateWs = useMutation(api.workspaces.update)
  const removeWs = useMutation(api.workspaces.remove)
  const exportWs = useQuery(api.activities.exportWorkspace, wsId ? { workspaceId: wsId } : "skip")

  const [name, setName] = React.useState("")
  const [wsName, setWsName] = React.useState("")
  const [wsDesc, setWsDesc] = React.useState("")
  const [wsCurrency, setWsCurrency] = React.useState("EUR")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (me?.name) setName(me.name)
  }, [me])
  React.useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name)
      setWsDesc(activeWorkspace.description ?? "")
      setWsCurrency(activeWorkspace.currency ?? "EUR")
    }
  }, [activeWorkspace])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSaving(true)
      await updateUser({ name })
      toast.success(t("toasts.profileSaved"))
    } catch (err: any) {
      toast.error(err?.message || t("toasts.failed"))
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (!wsId) return
    try {
      setSaving(true)
      await updateWs({ workspaceId: wsId, name: wsName, description: wsDesc || undefined, currency: wsCurrency })
      toast.success(t("toasts.workspaceSaved"))
    } catch (err: any) {
      toast.error(err?.message || t("toasts.failed"))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteWorkspace() {
    if (!wsId) return
    if (!confirm(t("dangerDescription"))) return
    try {
      await removeWs({ workspaceId: wsId })
      setActiveWorkspaceId(null)
      toast.success(t("toasts.workspaceDeleted"))
    } catch (err: any) {
      toast.error(err?.message || t("toasts.failed"))
    }
  }

  function handleExport() {
    if (!exportWs) return
    exportToJSON(`${activeWorkspace?.slug || "workspace"}-export`, exportWs)
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>

        <GlassCard className="p-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h2 className="text-sm font-semibold">{t("profile")}</h2>
            <div>
              <Label>{tCommon("name")}</Label>
              <Input data-testid="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={me?.email ?? ""} disabled />
            </div>
            <div className="flex justify-end">
              <Button data-testid="save-profile-btn" type="submit" disabled={saving} className="gap-2">
                <Save2 size={14} variant="Bulk" /> {tCommon("save")}
              </Button>
            </div>
          </form>
        </GlassCard>

        {activeWorkspace && (
          <GlassCard className="p-6">
            <form onSubmit={handleSaveWorkspace} className="space-y-4">
              <h2 className="text-sm font-semibold">{t("workspace")}</h2>
              <div>
                <Label>{tCommon("name")}</Label>
                <Input data-testid="ws-name" value={wsName} onChange={(e) => setWsName(e.target.value)} required />
              </div>
              <div>
                <Label>{tCommon("description")}</Label>
                <Textarea value={wsDesc} onChange={(e) => setWsDesc(e.target.value)} rows={2} />
              </div>
              <div>
                <Label>{tCommon("currency")}</Label>
                <Select value={wsCurrency} onValueChange={setWsCurrency}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR €</SelectItem>
                    <SelectItem value="USD">USD $</SelectItem>
                    <SelectItem value="GBP">GBP £</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                    <SelectItem value="CAD">CAD $</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button data-testid="export-gdpr-btn" type="button" variant="outline" onClick={handleExport} className="gap-2" disabled={!exportWs}>
                  <DocumentDownload size={14} variant="Bulk" /> {t("exportGdpr")}
                </Button>
                <Button data-testid="save-workspace-btn" type="submit" disabled={saving} className="gap-2">
                  <Save2 size={14} variant="Bulk" /> {tCommon("save")}
                </Button>
              </div>
            </form>
          </GlassCard>
        )}

        {activeWorkspace?.role === "owner" && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 space-y-3 backdrop-blur-xl">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <Danger size={16} variant="Bulk" /> {t("danger")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("dangerDescription")}</p>
            <Button data-testid="delete-workspace-btn" variant="destructive" onClick={handleDeleteWorkspace} className="gap-2">
              <Trash size={14} variant="Bulk" /> {t("deleteWorkspace")}
            </Button>
          </div>
        )}

        <GlassCard className="p-6">
          <Button data-testid="signout-btn" variant="ghost" onClick={() => signOut()} className="gap-2 text-muted-foreground">
            <LogoutCurve size={14} variant="Bulk" /> {t("signOut")}
          </Button>
        </GlassCard>
      </div>
    </div>
  )
}
