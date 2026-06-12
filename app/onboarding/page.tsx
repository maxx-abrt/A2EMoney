"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { useTranslations } from "next-intl"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Wallet, Building2, HeartHandshake, User as UserIcon, Loader2 } from "@/components/iconsax"
import { useWorkspace } from "@/lib/workspace-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const TYPES = [
  { id: "individual", icon: UserIcon, key: "individual" },
  { id: "business", icon: Building2, key: "business" },
  { id: "association", icon: HeartHandshake, key: "association" },
] as const

export default function OnboardingPage() {
  const router = useRouter()
  const t = useTranslations("onboarding")
  const me = useQuery(api.users.me, {})
  const myWorkspaces = useQuery(api.workspaces.listMine, {})
  const createWorkspace = useMutation(api.workspaces.create)
  const { setActiveWorkspaceId } = useWorkspace()
  const [type, setType] = React.useState<typeof TYPES[number]["id"]>("business")
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [currency, setCurrency] = React.useState("EUR")
  const [loading, setLoading] = React.useState(false)

  // If user already has a workspace, redirect to dashboard.
  React.useEffect(() => {
    if (myWorkspaces && myWorkspaces.length > 0) {
      router.replace("/dashboard")
    }
  }, [myWorkspaces, router])

  React.useEffect(() => {
    if (me?.name && !name) setName(`${me.name.split(" ")[0]}'s Workspace`)
  }, [me, name])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      setLoading(true)
      const id = await createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        currency,
      })
      setActiveWorkspaceId(id)
      toast.success(t("toasts.created"))
      router.push("/dashboard")
    } catch (err: any) {
      toast.error(err?.message || t("toasts.failed"))
    } finally {
      setLoading(false)
    }
  }

  if (myWorkspaces === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center border-b border-border/60 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">A2EMoney</span>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl space-y-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div>
            <Label className="mb-2 block">{t("typeLabel")}</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {TYPES.map((opt) => {
                const Icon = opt.icon
                const active = type === opt.id
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setType(opt.id)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                      active
                        ? "border-foreground bg-foreground/5 ring-2 ring-foreground/10"
                        : "border-border bg-card hover:bg-muted/40",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        active ? "bg-foreground text-background" : "bg-muted text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{t(`types.${opt.key}.title`)}</div>
                      <div className="text-xs text-muted-foreground">{t(`types.${opt.key}.description`)}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">{t("nameLabel")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
              />
            </div>
            <div>
              <Label htmlFor="currency">{t("currencyLabel")}</Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="EUR">EUR &euro;</option>
                <option value="USD">USD $</option>
                <option value="GBP">GBP &pound;</option>
                <option value="CHF">CHF</option>
                <option value="CAD">CAD $</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">{t("descriptionLabel")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("submit")}
          </Button>
        </form>
      </main>
    </div>
  )
}
