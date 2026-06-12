"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useWorkspace } from "@/lib/workspace-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { ArrowLeft, Plus, Download, Loader2, Trash2 } from "@/components/iconsax"
import { toast } from "sonner"
import { exportToXLSX, exportToCSV } from "@/lib/export"

export default function BookSheetPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const sheetId = params?.id as Id<"a2e_bookSheets">
  const { activeWorkspace } = useWorkspace()

  const sheet = useQuery(api.a2e_books.getSheet, sheetId ? { sheetId } : "skip")
  const entries = useQuery(api.a2e_books.listEntries, sheetId ? { sheetId } : "skip")
  const createEntry = useMutation(api.a2e_books.createEntry)
  const updateEntry = useMutation(api.a2e_books.updateEntry)
  const removeEntry = useMutation(api.a2e_books.removeEntry)

  const [draft, setDraft] = React.useState<Record<string, any>>({})

  if (!sheet) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const columns: any[] = (sheet as any).columns || []

  async function handleAddRow(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createEntry({ sheetId, cells: draft })
      setDraft({})
    } catch (err: any) {
      toast.error(err?.message || "Could not add row")
    }
  }

  async function handleCellEdit(entryId: Id<"a2e_bookEntries">, colId: string, value: any) {
    const entry = entries?.find((e) => e._id === entryId)
    if (!entry) return
    await updateEntry({
      entryId,
      cells: { ...(entry.cells || {}), [colId]: value },
    })
  }

  function handleExport(fmt: "csv" | "xlsx") {
    if (!sheet) return
    const headers = columns.map((c: any) => c.name)
    const rows = (entries ?? []).map((e) => columns.map((c: any) => formatCell(e.cells?.[c.id], c.type)))
    if (fmt === "csv") exportToCSV(sheet.name, headers, rows)
    else exportToXLSX(sheet.name, headers, rows)
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href="/dashboard/book"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg text-lg" style={{ background: (sheet.color || "#22c55e") + "20" }}>
                {sheet.icon || "📒"}
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{sheet.name}</h1>
                <p className="text-xs text-muted-foreground">{(entries ?? []).length} rows · {columns.length} columns</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport("csv")} className="gap-2"><Download className="h-3.5 w-3.5" /> CSV</Button>
            <Button variant="outline" onClick={() => handleExport("xlsx")} className="gap-2"><Download className="h-3.5 w-3.5" /> XLSX</Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {columns.map((c: any) => (
                    <th key={c.id} className="px-4 py-2.5">{c.name}</th>
                  ))}
                  <th className="px-4 py-2.5 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(entries ?? []).map((e) => (
                  <tr key={e._id} className="hover:bg-muted/20">
                    {columns.map((c: any) => (
                      <td key={c.id} className="px-4 py-2">
                        <CellEditor
                          column={c}
                          value={e.cells?.[c.id]}
                          onChange={(v) => handleCellEdit(e._id, c.id, v)}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeEntry({ entryId: e._id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-2">
                    <form onSubmit={handleAddRow} className="flex flex-wrap items-end gap-2">
                      {columns.map((c: any) => (
                        <div key={c.id} className="min-w-[120px] flex-1">
                          <CellEditor
                            column={c}
                            value={draft[c.id]}
                            onChange={(v) => setDraft({ ...draft, [c.id]: v })}
                            compact
                          />
                        </div>
                      ))}
                      <Button type="submit" size="sm" className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
                    </form>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function CellEditor({
  column,
  value,
  onChange,
  compact,
}: {
  column: any
  value: any
  onChange: (v: any) => void
  compact?: boolean
}) {
  const cls = compact
    ? "h-8 text-xs"
    : "h-8 text-sm border-none bg-transparent shadow-none focus-visible:ring-1"

  if (column.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    )
  }
  if (column.type === "select") {
    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`flex w-full rounded-md border border-input bg-transparent px-2 ${cls}`}
      >
        <option value="">—</option>
        {(column.options || []).map((opt: string) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    )
  }
  if (column.type === "date") {
    return (
      <Input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={cls} />
    )
  }
  if (column.type === "number" || column.type === "currency") {
    return (
      <Input type="number" step="0.01" value={value ?? ""} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className={cls} />
    )
  }
  return (
    <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={column.name} />
  )
}

function formatCell(val: any, type: string): string {
  if (val === undefined || val === null || val === "") return ""
  if (type === "checkbox") return val ? "TRUE" : "FALSE"
  if (type === "date") return String(val)
  return String(val)
}
