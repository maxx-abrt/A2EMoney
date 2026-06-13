"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useWorkspace } from "@/lib/workspace-context"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
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
  Activity,
  Judge,
  Setting2,
  ArrowRight,
  SearchNormal1,
  HardDrive,
  NoteText,
} from "@/components/iconsax"

const pages = [
  { label: "Dashboard", href: "/dashboard", icon: Element4 },
  { label: "Book", href: "/dashboard/book", icon: Book1 },
  { label: "Expenses", href: "/dashboard/expenses", icon: ReceiptText },
  { label: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { label: "Budget", href: "/dashboard/budget", icon: Wallet3 },
  { label: "Project sheets", href: "/dashboard/fiches", icon: ClipboardText },
  { label: "Invoices", href: "/dashboard/invoices", icon: DocumentText1 },
  { label: "Clients", href: "/dashboard/clients", icon: People },
  { label: "Documents", href: "/dashboard/documents", icon: HardDrive },
  { label: "Reports", href: "/dashboard/reports", icon: Chart },
  { label: "Team", href: "/dashboard/team", icon: People },
  { label: "Activity", href: "/dashboard/activity", icon: Activity },
  { label: "Legal", href: "/dashboard/legal", icon: Judge },
  { label: "Settings", href: "/dashboard/settings", icon: Setting2 },
]

export function CommandPalette() {
  const router = useRouter()
  const t = useTranslations("nav")
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?._id

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const expenses = useQuery(api.a2e_expenses.list, wsId && query.length > 1 ? { workspaceId: wsId } : "skip")
  const invoices = useQuery(api.a2e_invoices.list, wsId && query.length > 1 ? { workspaceId: wsId } : "skip")
  const projects = useQuery(api.projects.list, wsId && query.length > 1 ? { workspaceId: wsId } : "skip")
  const clients = useQuery(api.a2e_clients.list, wsId && query.length > 1 ? { workspaceId: wsId } : "skip")

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const filteredExpenses = React.useMemo(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return (expenses ?? []).filter((e) => e.description.toLowerCase().includes(q)).slice(0, 5)
  }, [expenses, query])

  const filteredInvoices = React.useMemo(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return (invoices ?? []).filter((i) => i.client.toLowerCase().includes(q) || i.number.toLowerCase().includes(q)).slice(0, 5)
  }, [invoices, query])

  const filteredProjects = React.useMemo(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return (projects ?? []).filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5)
  }, [projects, query])

  const filteredClients = React.useMemo(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return (clients ?? []).filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5)
  }, [clients, query])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t("search")} value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {pages.map((p) => (
            <CommandItem key={p.href} onSelect={() => go(p.href)} className="gap-2">
              <p.icon className="h-4 w-4 text-muted-foreground" />
              <span>{t(p.label.toLowerCase().replace(/\s/g, "")) || p.label}</span>
              <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup>
        {filteredProjects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {filteredProjects.map((p) => (
                <CommandItem key={p._id} onSelect={() => go(`/dashboard/projects/${p._id}`)} className="gap-2">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {filteredClients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Clients">
              {filteredClients.map((c) => (
                <CommandItem key={c._id} onSelect={() => go(`/dashboard/clients`)} className="gap-2">
                  <People className="h-4 w-4 text-muted-foreground" />
                  <span>{c.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {filteredInvoices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Invoices">
              {filteredInvoices.map((i) => (
                <CommandItem key={i._id} onSelect={() => go(`/dashboard/invoices`)} className="gap-2">
                  <DocumentText1 className="h-4 w-4 text-muted-foreground" />
                  <span>{i.number} — {i.client}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {filteredExpenses.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Transactions">
              {filteredExpenses.map((e) => (
                <CommandItem key={e._id} onSelect={() => go(`/dashboard/expenses`)} className="gap-2">
                  <ReceiptText className="h-4 w-4 text-muted-foreground" />
                  <span>{e.description}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{e.type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
