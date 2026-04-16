"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useDataStore, formatBytes } from "@/lib/data-store"
import { useUser } from "@/lib/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LanguageSwitcher } from "@/components/language-switcher"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Sheet as SheetComponent,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronLeft,
  FileText,
  FolderOpen,
  Gavel,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  PlusCircle,
  Receipt,
  Search,
  Settings,
  Sun,
  User,
  Users,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"

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
  { key: "invoices", href: "/dashboard/invoices", icon: FileText, group: "main", businessOnly: true },
  { key: "projects", href: "/dashboard/projects", icon: FolderOpen, group: "main", businessOnly: true },
  { key: "book", href: "/dashboard/book", icon: BookOpen, group: "main" },
  { key: "documents", href: "/dashboard/documents", icon: HardDrive, group: "main" },
  { key: "reports", href: "/dashboard/reports", icon: BarChart3, group: "secondary" },
  { key: "team", href: "/dashboard/team", icon: Users, group: "secondary" },
  { key: "legal", href: "/dashboard/legal", icon: Gavel, group: "secondary", businessOnly: true },
  { key: "settings", href: "/dashboard/settings", icon: Settings, group: "secondary" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { profile, isLoading, logout } = useUser()
  const { storage } = useDataStore()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const t = useTranslations("nav")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  // Persist collapsed state
  useEffect(() => {
    const stored = localStorage.getItem("finflow_sidebar_collapsed")
    if (stored === "1") setCollapsed(true)
  }, [])
  useEffect(() => {
    localStorage.setItem("finflow_sidebar_collapsed", collapsed ? "1" : "0")
  }, [collapsed])

  // Redirect if no profile or onboarding incomplete
  useEffect(() => {
    if (!isLoading && !profile) router.push("/")
    else if (!isLoading && profile && !profile.onboardingComplete) router.push("/onboarding")
  }, [isLoading, profile, router])

  // Cmd+K command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCommandOpen(prev => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const isBusiness = profile?.type === "business" || profile?.type === "association"
  const visibleNav = useMemo(
    () => navItems.filter(item => !item.businessOnly || isBusiness),
    [isBusiness],
  )
  const mainNav = visibleNav.filter(i => i.group === "main")
  const secondaryNav = visibleNav.filter(i => i.group === "secondary")

  const storagePercent = storage ? Math.min(100, (storage.used / storage.total) * 100) : 0

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  const runCommand = (fn: () => void) => () => {
    setCommandOpen(false)
    fn()
  }

  const renderNavLink = (item: NavItem, forceExpanded = false) => {
    const Icon = item.icon
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
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
            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-accent"
            aria-hidden
          />
        )}
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            active ? "" : "text-muted-foreground group-hover:scale-110 group-hover:text-foreground",
          )}
        />
        {showLabel ? <span className="truncate">{t(item.key)}</span> : null}
      </Link>
    )
  }

  const sidebar = (forceExpanded = false) => (
    <div
      className={cn(
        "flex h-full flex-col transition-[width] duration-300 ease-in-out",
        forceExpanded ? "" : collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b border-border px-4", collapsed && !forceExpanded ? "justify-center" : "justify-between")}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
            <Wallet className="h-4 w-4" />
          </div>
          {(!collapsed || forceExpanded) && <span className="text-base font-semibold tracking-tight">Finflow</span>}
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

      {/* Profile badge */}
      {(!collapsed || forceExpanded) && (
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
              {isBusiness ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile.organizationName || profile.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {isBusiness ? (profile.type === "association" ? "Association" : "Business") : "Personal"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {(!collapsed || forceExpanded) && (
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Workspace
            </p>
          )}
          {mainNav.map(item => renderNavLink(item, forceExpanded))}
        </div>
        <div className="space-y-1">
          {(!collapsed || forceExpanded) && (
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Manage
            </p>
          )}
          {secondaryNav.map(item => renderNavLink(item, forceExpanded))}
        </div>
      </nav>

      {/* Storage + Logout */}
      <div className="border-t border-border p-3">
        {(!collapsed || forceExpanded) && storage && (
          <div className="mb-3 rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{t("storage")}</span>
              <span className="text-muted-foreground">{Math.round(storagePercent)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-accent" style={{ width: `${storagePercent}%` }} />
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
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start gap-2 text-muted-foreground">
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
          {/* Top bar */}
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
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:max-w-md"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate text-left">Search everywhere…</span>
              <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                ⌘K
              </kbd>
            </button>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <LanguageSwitcher />
              <NotificationsDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 flex h-9 items-center gap-2 rounded-full border border-border bg-card px-2 pr-3 transition-colors hover:bg-muted">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                      {profile.name
                        .split(" ")
                        .map(n => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="hidden text-sm font-medium sm:inline">{profile.name.split(" ")[0]}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-xs text-muted-foreground">{profile.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" /> {t("settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 animate-fade-in">{children}</main>
        </div>
      </div>

      {/* Command palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {visibleNav.map(item => (
              <CommandItem key={item.key} onSelect={runCommand(() => router.push(item.href))}>
                <item.icon className="mr-2 h-4 w-4" />
                {t(item.key)}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Create">
            <CommandItem onSelect={runCommand(() => router.push("/dashboard/expenses?new=1"))}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New expense
              <CommandShortcut>⌘E</CommandShortcut>
            </CommandItem>
            {isBusiness && (
              <CommandItem onSelect={runCommand(() => router.push("/dashboard/invoices?new=1"))}>
                <FileText className="mr-2 h-4 w-4" />
                New invoice
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
            )}
            <CommandItem onSelect={runCommand(() => router.push("/dashboard/book?new=1"))}>
              <BookOpen className="mr-2 h-4 w-4" />
              New book sheet
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Preferences">
            <CommandItem onSelect={runCommand(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>
              {resolvedTheme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              Toggle theme
            </CommandItem>
            <CommandItem onSelect={runCommand(logout)}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("signOut")}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
