"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Download, Loader2, Trash2, Setting2 } from "@/components/iconsax"
import { toast } from "sonner"
import { exportToXLSX, exportToCSV } from "@/lib/export"
import { SheetIcon, SheetIconPicker, SHEET_COLORS } from "@/components/sheet-icon-picker"

export default function BookSheetPage() {
  const params = useParams<{ id: string }>()
  const sheetId = params?.id as Id<"a2e_bookSheets">

  const sheet = useQuery(api.a2e_books.getSheet, sheetId ? { sheetId } : "skip")
  const entries = useQuery(api.a2e_books.listEntries, sheetId ? { sheetId } : "skip")
  const createEntry = useMutation(api.a2e_books.createEntry)
  const updateEntry = useMutation(api.a2e_books.updateEntry)
  const removeEntry = useMutation(api.a2e_books.removeEntry)
  const updateSheet = useMutation(api.a2e_books.updateSheet)

  const [draft, setDraft] = React.useState<Record<string, any>>({})
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [editName, setEditName] = React.useState("")
  const [editIcon, setEditIcon] = React.useState<string>("Book1")
  const [editColor, setEditColor] = React.useState<string>(SHEET_COLORS[0])
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (sheet) {
      setEditName(sheet.name || "")
      setEditIcon((sheet.icon as string) || "Book1")
      setEditColor(sheet.color || SHEET_COLORS[0])
    }
  }, [sheet])

  if (!sheet) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={20} variant="Bulk" className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  const columns: any[] = (sheet as any).columns || []
  const sheetColor = sheet.color || SHEET_COLORS[0]

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
    try {
      await updateEntry({
        entryId,
        cells: { ...(entry.cells || {}), [colId]: value },
      })
    } catch (err: any) {
      toast.error(err?.message || "Could not update")
    }
  }

  async function handleSaveSettings() {
    try {
      setSaving(true)
      await updateSheet({
        sheetId,
        name: editName.trim() || sheet.name,
        icon: editIcon,
        color: editColor,
      })
      toast.success("Saved")
      setSettingsOpen(false)
    } catch (err: any) {
      toast.error(err?.message || "Could not save")
    } finally {
      setSaving(false)
    }
  }

  function handleExport(fmt: "csv" | "xlsx") {
    if (!sheet) return
    const headers = columns.map((c: any) => c.name)
    const rows = (entries ?? []).map((e) =>
      columns.map((c: any) => formatCell(e.cells?.[c.id], c.type)),
    )
    if (fmt === "csv") exportToCSV(sheet.name, headers, rows)
    else exportToXLSX(sheet.name, headers, rows)
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8" data-testid="back-to-book">
              <Link href="/dashboard/book">
                <ArrowLeft size={16} variant="Bulk" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: sheetColor + "20", color: sheetColor }}
              >
                <SheetIcon iconKey={sheet.icon} size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight" data-testid="sheet-title">
                  {sheet.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {(entries ?? []).length} rows · {columns.length} columns
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="sheet-settings-btn">
                  <Setting2 size={14} variant="Bulk" /> Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sheet settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <div>
                      <Label className="text-xs uppercase tracking-wider">Icon</Label>
                      <div className="mt-1">
                        <SheetIconPicker
                          value={editIcon}
                          color={editColor}
                          onChange={setEditIcon}
                          onColorChange={setEditColor}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs uppercase tracking-wider">Name</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        data-testid="sheet-edit-name"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSaveSettings} disabled={saving} data-testid="sheet-save-settings">
                    {saving ? <Loader2 size={14} variant="Bulk" className="animate-spin" /> : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => handleExport("csv")} className="gap-2">
              <Download size={14} variant="Bulk" /> CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport("xlsx")} className="gap-2">
              <Download size={14} variant="Bulk" /> XLSX
            </Button>
          </div>
        </div>

        {/* Desktop / tablet: table view */}
        <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xl sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/70 bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {columns.map((c: any) => (
                    <th key={c.id} className="whitespace-nowrap px-4 py-2.5">
                      {c.name}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {(entries ?? []).map((e) => (
                  <tr key={e._id} className="hover:bg-muted/20">
                    {columns.map((c: any) => (
                      <td key={c.id} className="px-4 py-2 align-middle">
                        <CellEditor
                          column={c}
                          value={e.cells?.[c.id]}
                          onChange={(v) => handleCellEdit(e._id, c.id, v)}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeEntry({ entryId: e._id })}
                        data-testid={`row-delete-${e._id}`}
                      >
                        <Trash2 size={14} variant="Bulk" />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={columns.length + 1} className="bg-muted/10 px-4 py-3">
                    <form onSubmit={handleAddRow} className="flex flex-wrap items-end gap-2">
                      {columns.map((c: any) => (
                        <div key={c.id} className="min-w-[140px] flex-1">
                          <CellEditor
                            column={c}
                            value={draft[c.id]}
                            onChange={(v) => setDraft({ ...draft, [c.id]: v })}
                            compact
                            placeholder={c.name}
                          />
                        </div>
                      ))}
                      <Button type="submit" size="sm" className="gap-1" data-testid="add-row-btn">
                        <Plus size={12} variant="Bulk" /> Add
                      </Button>
                    </form>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile: stacked card view */}
        <div className="space-y-3 sm:hidden">
          {(entries ?? []).map((e) => (
            <div
              key={e._id}
              className="rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  {columns.map((c: any) => (
                    <div key={c.id}>
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {c.name}
                      </Label>
                      <CellEditor
                        column={c}
                        value={e.cells?.[c.id]}
                        onChange={(v) => handleCellEdit(e._id, c.id, v)}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeEntry({ entryId: e._id })}
                >
                  <Trash2 size={14} variant="Bulk" />
                </Button>
              </div>
            </div>
          ))}
          <form
            onSubmit={handleAddRow}
            className="space-y-2 rounded-2xl border border-dashed border-border/70 bg-card/40 p-4 backdrop-blur-xl"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Add row
            </p>
            {columns.map((c: any) => (
              <div key={c.id}>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {c.name}
                </Label>
                <CellEditor
                  column={c}
                  value={draft[c.id]}
                  onChange={(v) => setDraft({ ...draft, [c.id]: v })}
                  placeholder={c.name}
                />
              </div>
            ))}
            <Button type="submit" size="sm" className="w-full gap-1">
              <Plus size={12} variant="Bulk" /> Add
            </Button>
          </form>
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
  placeholder,
}: {
  column: any
  value: any
  onChange: (v: any) => void
  compact?: boolean
  placeholder?: string
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
        className="h-4 w-4 rounded border-input accent-foreground"
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
        <option value="">-</option>
        {(column.options || []).map((opt: string) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    )
  }
  if (column.type === "date") {
    return (
      <Input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      />
    )
  }
  if (column.type === "number" || column.type === "currency") {
    return (
      <Input
        type="number"
        step="0.01"
        value={value ?? ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={cls}
        placeholder={placeholder}
      />
    )
  }
  return (
    <Input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={cls}
      placeholder={placeholder || column.name}
    />
  )
}

function formatCell(val: any, type: string): string {
  if (val === undefined || val === null || val === "") return ""
  if (type === "checkbox") return val ? "TRUE" : "FALSE"
  return String(val)
}
