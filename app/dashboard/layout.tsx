"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserProvider, useUser } from "@/lib/user-context"
import { DataStoreProvider } from "@/lib/data-store"
import { LanguageSwitcher } from "@/components/language-switcher"
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Menu,
  PieChart,
  Receipt,
  Scale,
  Search,
  Settings,
  User,
  Users,
  Wallet,
  X,
  Briefcase,
  LogOut,
  Moon,
  Sun,
  FolderOpen,
  HardDrive,
} from "lucide-react"

interface NavItem {
  nameKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  businessOnly?: boolean
  individualOnly?: boolean
}

function getMainNavItems(t: (key: string) => string): NavItem[] {
  return [
    { nameKey: t('nav.dashboard'), href: "/dashboard", icon: LayoutDashboard },
    { nameKey: t('nav.budget'), href: "/dashboard/budget", icon: PieChart },
    { nameKey: t('nav.expenses'), href: "/dashboard/expenses", icon: Receipt },
    { nameKey: t('nav.invoices'), href: "/dashboard/invoices", icon: FileText, businessOnly: true },
    { nameKey: t('nav.projects'), href: "/dashboard/projects", icon: Briefcase, businessOnly: true },
    { nameKey: t('nav.book'), href: "/dashboard/book", icon: FileSpreadsheet },
    { nameKey: t('nav.documents'), href: "/dashboard/documents", icon: FolderOpen },
    { nameKey: t('nav.legal'), href: "/dashboard/legal", icon: Scale, businessOnly: true },
    { nameKey: t('nav.reports'), href: "/dashboard/reports", icon: BarChart3 },
  ]
}

function getSecondaryNavItems(t: (key: string) => string): NavItem[] {
  return [
    { nameKey: t('nav.team'), href: "/dashboard/team", icon: Users, businessOnly: true },
    { nameKey: t('nav.settings'), href: "/dashboard/settings", icon: Settings },
  ]
}

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const { profile, logout } = useUser()
  const t = useTranslations()

  const mainNavItems = getMainNavItems(t)
  const secondaryNavItems = getSecondaryNavItems(t)

  const filteredMainNav = mainNavItems.filter((item: NavItem) => {
    if (profile?.profileType === "individual" && item.businessOnly) return false
    if (profile?.profileType === "business" && item.individualOnly) return false
    return true
  })

  const filteredSecondaryNav = secondaryNavItems.filter((item: NavItem) => {
    if (profile?.profileType === "individual" && item.businessOnly) return false
    return true
  })

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-border bg-card shadow-lg transition-transform lg:static lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent shadow-sm">
                <Wallet className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">Finflow</span>
            </Link>
            <button className="rounded-lg border border-border p-1.5 hover:bg-muted lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Profile Badge */}
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                {profile?.profileType === "business" ? (
                  <Building2 className="h-5 w-5 text-accent" />
                ) : (
                  <User className="h-5 w-5 text-accent" />
                )}
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-semibold">
                  {profile?.profileType === "business" ? profile?.organizationName || profile?.name : profile?.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize font-medium">{profile?.profileType}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {filteredMainNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "border-transparent bg-accent text-accent-foreground shadow-sm"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.nameKey}
                    {item.badge && (
                      <span className="ml-auto rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="my-4 h-px bg-border" />

            <nav className="space-y-1">
              {filteredSecondaryNav.map((item: NavItem) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "border-transparent bg-accent text-accent-foreground shadow-sm"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.nameKey}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Storage Info */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <HardDrive className="h-3 w-3" />
              <span className="font-medium">{t('nav.storage')}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-accent" style={{ width: "15%" }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">15 MB / 100 MB</p>
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-border p-4">
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg border border-transparent hover:border-border hover:bg-muted font-medium" onClick={logout}>
              <LogOut className="h-5 w-5" />
              {t('nav.signOut')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <button
            className="rounded-lg border border-border p-2 hover:bg-muted lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="hidden flex-1 md:flex">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder={t('dashboard.search')}
                className="h-10 w-full rounded-lg border border-border bg-muted pl-10 pr-4 text-sm font-medium outline-none transition-colors placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            {/* Mobile Search */}
            <Button variant="ghost" size="icon" className="rounded-lg border border-transparent hover:border-border md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* Dark Mode Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-lg border border-transparent hover:border-border">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Language Switcher */}
            <LanguageSwitcher variant="ghost" size="icon" className="rounded-lg border border-transparent hover:border-border" />

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative rounded-lg border border-transparent hover:border-border">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 rounded-lg border border-transparent hover:border-border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary font-bold text-sm">
                    {profile?.name?.charAt(0) || "U"}
                  </div>
                  <span className="hidden text-sm font-semibold sm:inline-block">{profile?.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-lg border shadow-lg">
                <DropdownMenuLabel className="font-bold">{t('dashboard.myAccount')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="font-medium">
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('nav.settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="font-medium">
                  <Link href="/dashboard/settings#profile">
                    <User className="mr-2 h-4 w-4" />
                    {t('dashboard.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive font-medium">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <DataStoreProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </DataStoreProvider>
    </UserProvider>
  )
}
