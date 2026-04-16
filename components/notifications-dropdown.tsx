"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { formatDistanceToNowStrict } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { notificationsAPI } from "@/lib/api-client"
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Receipt,
  HardDrive,
  UserPlus,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  link: string | null
  createdAt: string
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  invoice_paid: FileText,
  invoice_overdue: FileText,
  expense_added: Receipt,
  storage_warning: HardDrive,
  invitation_received: UserPlus,
  invitation_accepted: UserPlus,
  member_joined: Users,
  member_left: Users,
}

const TONES: Record<string, string> = {
  info: "text-blue-500 bg-blue-500/10",
  success: "text-emerald-600 bg-emerald-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  error: "text-destructive bg-destructive/10",
  invoice_paid: "text-emerald-600 bg-emerald-500/10",
  invoice_overdue: "text-destructive bg-destructive/10",
  expense_added: "text-purple-500 bg-purple-500/10",
  storage_warning: "text-amber-500 bg-amber-500/10",
  invitation_received: "text-blue-500 bg-blue-500/10",
  invitation_accepted: "text-emerald-600 bg-emerald-500/10",
  member_joined: "text-emerald-600 bg-emerald-500/10",
  member_left: "text-muted-foreground bg-muted",
}

export function NotificationsDropdown() {
  const t = useTranslations("notifications")
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = (await notificationsAPI.getAll()) as NotificationItem[]
      setItems(Array.isArray(data) ? data : [])
    } catch {
      // Silent — DB may not be available yet
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + poll every 60s
  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), 60000)
    return () => clearInterval(id)
  }, [load])

  // Refresh when the popover opens
  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const unreadCount = useMemo(
    () => items.filter(n => !n.read).length,
    [items],
  )

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await notificationsAPI.markAllRead()
    } catch {}
  }

  const handleItemClick = async (n: NotificationItem) => {
    if (!n.read) {
      setItems(prev => prev.map(x => (x.id === n.id ? { ...x, read: true } : x)))
      try {
        await notificationsAPI.markRead(n.id)
      } catch {}
    }
    if (n.link) setOpen(false)
  }

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    setItems(prev => prev.filter(n => n.id !== id))
    try {
      await notificationsAPI.delete(id)
    } catch {}
  }

  const handleClearAll = async () => {
    setItems([])
    try {
      await notificationsAPI.clearAll()
    } catch {}
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("open")}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[360px] p-0 rounded-xl border shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-sm font-semibold">{t("title")}</div>
            <div className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? t("unreadCount", { count: unreadCount })
                : t("allRead")}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 gap-1.5 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("markAllRead")}
            </Button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <BellOff className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium">{t("emptyTitle")}</div>
              <div className="text-xs text-muted-foreground">
                {t("emptyDescription")}
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map(n => {
                const Icon = ICONS[n.type] ?? Info
                const tone = TONES[n.type] ?? TONES.info
                const content = (
                  <div className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        tone,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            n.read ? "font-medium" : "font-semibold",
                          )}
                        >
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDistanceToNowStrict(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleRemove(e, n.id)}
                      className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      aria-label={t("dismiss")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => handleItemClick(n)}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleItemClick(n)}
                        className="block w-full"
                      >
                        {content}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("clearAll")}
            </button>
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("preferences")}
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
