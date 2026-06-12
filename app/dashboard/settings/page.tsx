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
import { LogOut, Save, Trash2, AlertTriangle, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { exportToJSON } from "@/lib/export"

export default function SettingsPage() {
  const t = useTranslations("common")
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
      toast.success("Profile saved")
    } catch (err: any) {
      toast.error(err?.message || "Could not save")
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
      toast.success("Workspace saved")
    } catch (err: any) {
      toast.error(err?.message || "Could not save")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteWorkspace() {
    if (!wsId) return
    if (!confirm("Delete this workspace? This cannot be undone.")) return
    try {
      await removeWs({ workspaceId: wsId })
      setActiveWorkspaceId(null)
      toast.success("Workspace deleted")
    } catch (err: any) {
      toast.error(err?.message || "Could not delete")
    }
  }

  function handleExport() {
    if (!exportWs) return
    exportToJSON(`${activeWorkspace?.slug || "workspace"}-export`, exportWs)
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your profile and active workspace.</p>
        </div>

        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold">Profile</h2>
          <div>
            <Label>{t("name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={me?.email ?? ""} disabled />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2"><Save className="h-3.5 w-3.5" /> {t("save")}</Button>
          </div>
        </form>

        {activeWorkspace && (
          <form onSubmit={handleSaveWorkspace} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold">Workspace</h2>
            <div>
              <Label>{t("name")}</Label>
              <Input value={wsName} onChange={(e) => setWsName(e.target.value)} required />
            </div>
            <div>
              <Label>{t("description")}</Label>
              <Textarea value={wsDesc} onChange={(e) => setWsDesc(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>{t("currency")}</Label>
              <select value={wsCurrency} onChange={(e) => setWsCurrency(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="EUR">EUR €</option>
                <option value="USD">USD $</option>
                <option value="GBP">GBP £</option>
                <option value="CHF">CHF</option>
                <option value="CAD">CAD $</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleExport} className="gap-2" disabled={!exportWs}><Download className="h-3.5 w-3.5" /> Export GDPR data</Button>
              <Button type="submit" disabled={saving} className="gap-2"><Save className="h-3.5 w-3.5" /> {t("save")}</Button>
            </div>
          </form>
        )}

        {activeWorkspace?.role === "owner" && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-destructive"><AlertTriangle className="h-4 w-4" /> Danger zone</h2>
            <p className="text-xs text-muted-foreground">Deleting a workspace removes all invoices, expenses, books, budgets, projects and members associated with it. This action is permanent.</p>
            <Button variant="destructive" onClick={handleDeleteWorkspace} className="gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete workspace</Button>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-6">
          <Button variant="ghost" onClick={() => signOut()} className="gap-2 text-muted-foreground"><LogOut className="h-3.5 w-3.5" /> Sign out</Button>
        </div>
      </div>
    </div>
  )
}
