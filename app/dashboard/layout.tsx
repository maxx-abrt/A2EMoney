"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useWorkspace } from "@/lib/workspace-context"
import { formatBytes } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet as SheetComponent,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  Element4,
  Wallet3,
  ReceiptText,
  DocumentText1,
  FolderOpen,
  ClipboardText,
  Book1,
  Folder2,
  Chart,
  People,
  Activity as ActivityIcon,
  Judge,
  Setting2,
  LogoutCurve,
  HambergerMenu,
  Sun1,
  Moon,
  ArrowLeft2,
  Wallet,
} from "@/components/iconsax"
import { cn } from "@/lib/utils"

type IconProps = { className?: string; size?: number }

const iconAdapter = (Comp: any) =>
  function Adapted({ className, size = 18 }: IconProps) {
    return <Comp className={className} size={size} variant="Bulk" />
  }

const LayoutDashboard = iconAdapter(Element4)
const PiggyBank = iconAdapter(Wallet3)
const Receipt = iconAdapter(ReceiptText)
const FileText = iconAdapter(DocumentText1)
const FolderOpenIcon = iconAdapter(FolderOpen)
const ClipboardList = iconAdapter(ClipboardText)
const BookOpen = iconAdapter(Book1)
const HardDrive = iconAdapter(Folder2)
const BarChart3 = iconAdapter(Chart)
const Users = iconAdapter(People)
const Activity = iconAdapter(ActivityIcon)
const Gavel = iconAdapter(Judge)
const Settings = iconAdapter(Setting2)
const LogOut = iconAdapter(LogoutCurve)
const Menu = iconAdapter(HambergerMenu)
const Sun = iconAdapter(Sun1)
const MoonIcon = iconAdapter(Moon)
const ChevronLeft = iconAdapter(ArrowLeft2)
const WalletIcon = iconAdapter(Wallet)

interface NavItem {
  key: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  group: "main" | "secondary"
  businessOnly?: boolean
}

const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, group: "main" },
  { key: "budget", href: "/dashboard/budget", icon: PiggyBank, group: "main" },
  { key: "expenses", href: "/dashboard/expenses", icon: Receipt, group: "main" },
  { key: "invoices", href: "/dashboard/invoices", icon: FileText, group: "main" },
  { key: "projects", href: "/dashboard/projects", icon: FolderOpenIcon, group: "main" },
  { key: "fiches", href: "/dashboard/fiches", icon: ClipboardList, group: "main" },
  { key: "book", href: "/dashboard/book", icon: BookOpen, group: "main" },
  { key: "documents", href: "/dashboard/documents", icon: HardDrive, group: "main" },
  { key: "reports", href: "/dashboard/reports", icon: BarChart3, group: "secondary" },
  { key: "team", href: "/dashboard/team", icon: Users, group: "secondary" },
  { key: "activity", href: "/dashboard/activity", icon: Activity, group: "secondary" },
  { key: "legal", href: "/dashboard/legal", icon: Gavel, group: "secondary" },
  { key: "settings", href: "/dashboard/settings", icon: Settings, group: "secondary" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuth()
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip")
  const { workspaces, activeWorkspace, isLoading: wsLoading } = useWorkspace()
  const storage = useQuery(
    api.workspaces.getStorage,
    activeWorkspace ? { workspaceId: activeWorkspace._id } : "skip",
  )
  const { theme, setTheme, resolvedTheme } = useTheme()
  const t = useTranslations("nav")
  const tSections = useTranslations("pages.sections")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Persist collapsed state
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("a2e_sidebar_collapsed") : null
    if (stored === "1") setCollapsed(true)
  }, [])
  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("a2e_sidebar_collapsed", collapsed ? "1" : "0")
  }, [collapsed])

  // Redirect unauthenticated users to the WorkOS hosted login.
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      const search = typeof window !== "undefined" ? window.location.search : ""
      const next = pathname + search
      router.replace(`/sign-in?returnPathname=${encodeURIComponent(next)}`)
    }
  }, [authLoading, isAuthenticated, pathname, router])

  // Redirect to onboarding if authenticated and no workspaces
  useEffect(() => {
    if (authLoading || wsLoading) return
    if (!isAuthenticated) return
    if (workspaces && workspaces.length === 0 && pathname !== "/onboarding") {
      router.replace("/onboarding")
    }
  }, [authLoading, wsLoading, isAuthenticated, workspaces, pathname, router])

  const storagePercent = storage ? Math.min(100, storage.percentage) : 0

  // Wait while auth resolves, the user is provisioned in Convex, or workspaces load.
  const provisioning = isAuthenticated && (me === undefined || me === null)
  if (authLoading || !isAuthenticated || (isAuthenticated && wsLoading) || provisioning) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  const renderNavLink = (item: NavItem, forceExpanded = false) => {
    const Icon = item.icon
    const active =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href))
    const showLabel = forceExpanded || !collapsed
    return (
      <Link
        key={item.key}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
          active
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:translate-x-0.5 hover:bg-muted hover:text-foreground",
        )}
        title={collapsed && !forceExpanded ? t(item.key) : undefined}
      >
        {active && (
          <span
            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--brand-green)]"
            aria-hidden
          />
        )}
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            active
              ? ""
              : "text-muted-foreground group-hover:scale-110 group-hover:text-foreground",
          )}
        />
        {showLabel ? <span className="truncate">{t(item.key)}</span> : null}
      </Link>
    )
  }

  const mainNav = navItems.filter((i) => i.group === "main")
  const secondaryNav = navItems.filter((i) => i.group === "secondary")

  const sidebar = (forceExpanded = false) => (
    <div
      className={cn(
        "flex h-full flex-col transition-[width] duration-300 ease-in-out",
        forceExpanded ? "" : collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4",
          collapsed && !forceExpanded ? "justify-center" : "justify-between",
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
            <WalletIcon className="h-4 w-4" />
          </div>
          {(!collapsed || forceExpanded) && (
            <span className="text-base font-semibold tracking-tight">A2EMoney</span>
          )}
        </Link>
        {!forceExpanded && !collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="hidden h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Workspace switcher */}
      <div className="border-b border-border px-3 py-3">
        <WorkspaceSwitcher collapsed={collapsed && !forceExpanded} />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {(!collapsed || forceExpanded) && (
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {tSections("workspace")}
            </p>
          )}
          {mainNav.map((item) => renderNavLink(item, forceExpanded))}
        </div>
        <div className="space-y-1">
          {(!collapsed || forceExpanded) && (
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {tSections("manage")}
            </p>
          )}
          {secondaryNav.map((item) => renderNavLink(item, forceExpanded))}
        </div>
      </nav>

      {/* Storage + Logout */}
      <div className="border-t border-border p-3">
        {(!collapsed || forceExpanded) && storage && (
          <div className="mb-3 rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{t("storage")}</span>
              <span className="text-muted-foreground">
                {Math.round(storagePercent)}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[var(--brand-green)]"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">
              {formatBytes(storage.used)} / {formatBytes(storage.total)}
            </div>
          </div>
        )}
        {collapsed && !forceExpanded ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex h-9 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Expand sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span>{t("signOut")}</span>
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen border-r border-border bg-card md:block">
          {sidebar(false)}
        </aside>

        {/* Mobile sidebar */}
        <SheetComponent open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <VisuallyHidden>
              <SheetTitle>Navigation</SheetTitle>
            </VisuallyHidden>
            {sidebar(true)}
          </SheetContent>
        </SheetComponent>

        {/* Main area */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1" />
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </Button>
              <LanguageSwitcher />
              <NotificationsDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 flex h-9 items-center gap-2 rounded-full border border-border bg-card px-2 pr-3 transition-colors hover:bg-muted">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-primary">
                      {(me?.name || me?.email || "?")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="hidden text-sm font-medium sm:inline">
                      {(me?.name || me?.email || "").split(" ")[0]}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-medium">{me?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{me?.email ?? ""}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" /> {t("settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 animate-fade-in">{children}</main>
        </div>
      </div>
    </div>
  )
}
