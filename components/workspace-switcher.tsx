"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useCoreMutation, coreApi } from "@a2e/core"
import { useWorkspace } from "@/lib/workspace-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronsUpDown, Check, Plus, Users, Building2, Wallet, HeartHandshake } from "@/components/iconsax"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function TypeIcon({ type, className }: { type?: string; className?: string }) {
  if (type === "business") return <Building2 className={className} />
  if (type === "association") return <HeartHandshake className={className} />
  return <Wallet className={className} />
}

export function WorkspaceSwitcher({ collapsed }: { collapsed?: boolean }) {
  const t = useTranslations("workspace")
  const tOnb = useTranslations("onboarding")
  const router = useRouter()
  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useWorkspace()
  const createWorkspace = useCoreMutation(coreApi.workspaces.create)
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<"individual" | "business" | "association">("business")
  const [loading, setLoading] = React.useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      setLoading(true)
      const id = await createWorkspace({ name: name.trim(), type })
      setActiveWorkspaceId(id)
      toast.success(tOnb("toasts.created"))
      setOpen(false)
      setName("")
    } catch (err: any) {
      toast.error(err?.message || tOnb("toasts.failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
              collapsed && "justify-center",
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
              <TypeIcon type={activeWorkspace?.type} className="h-3.5 w-3.5" />
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {activeWorkspace?.name ?? t("switcher.noWorkspace")}
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {activeWorkspace
                      ? t("switcher.members", { count: activeWorkspace.memberCount })
                      : ""}
                  </div>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-72 rounded-xl"
        >
          <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("switcher.label")}
          </DropdownMenuLabel>
          {(workspaces ?? []).map((w) => (
            <DropdownMenuItem
              key={w._id}
              onClick={() => setActiveWorkspaceId(w._id)}
              className="flex items-center gap-2 py-2"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <TypeIcon type={w.type} className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{w.name}</div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {t("switcher.members", { count: w.memberCount })} · {w.role}
                </div>
              </div>
              {activeWorkspace?._id === w._id && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>{t("switcher.create")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/team" className="gap-2">
              <Users className="h-4 w-4" />
              <span>{t("switcher.manage")}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tOnb("title")}</DialogTitle>
            <DialogDescription>{tOnb("subtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4 px-1">
              <div>
                <Label htmlFor="ws-name">{tOnb("nameLabel")}</Label>
                <Input
                  id="ws-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tOnb("namePlaceholder")}
                  required
                />
              </div>
              <div>
                <Label>{tOnb("typeLabel")}</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["individual", "business", "association"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setType(opt)}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-xs font-medium transition",
                        type === opt
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {tOnb(`types.${opt}.title`)}
                    </button>
                  ))}
                </div>
              </div>
            </DialogBody>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {tOnb("submit") /* fallback if no cancel key */}
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "…" : tOnb("submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
