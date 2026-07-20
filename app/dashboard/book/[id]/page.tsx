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
import { ArrowLeft, Plus, Download, Loader2, Trash2, Setting2, Layers } from "@/components/iconsax"
import { toast } from "sonner"
import { exportToXLSX, exportToCSV } from "@/lib/export"
import { SheetIcon, SheetIconPicker, SHEET_COLORS } from "@/components/sheet-icon-picker"

type Column = {
  id: string
  name: string
  type: string
  options?: string[]
  required?: boolean
}

const COLUMN_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
]

function slugId(name: string) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
  return `${base || "col"}_${Math.random().toString(36).slice(2, 6)}`
}

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
  const [columnsOpen, setColumnsOpen] = React.useState(false)
  const [editName, setEditName] = React.useState("")
  const [editIcon, setEditIcon] = React.useState<string>("Book1")
  const [editColor, setEditColor] = React.useState<string>(SHEET_COLORS[0])
  const [colDraft, setColDraft] = React.useState<Column[]>([])
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (sheet) {
      setEditName(sheet.name || "")
      setEditIcon((sheet.icon as string) || "Book1")
      setEditColor(sheet.color || SHEET_COLORS[0])
    }
  }, [sheet])

  const columns: Column[] = ((sheet as any)?.columns || []) as Column[]

  function openColumns() {
    setColDraft(columns.map((c) => ({ ...c })))
    setColumnsOpen(true)
  }

  if (!sheet) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={20} variant="Bulk" className="animate-spin text-muted-foreground" />
      </div>
    )
  }

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

  async function handleSaveColumns() {
    const cleaned = colDraft
      .map((c) => ({
        id: c.id || slugId(c.name),
        name: c.name.trim() || "Column",
        type: c.type || "text",
        options: c.type === "select" ? (c.options || []).filter(Boolean) : undefined,
        required: c.required || undefined,
      }))
      .filter((c) => c.name)
    if (cleaned.length === 0) {
      toast.error("Add at least one column")
      return
    }
    try {
      setSaving(true)
      await updateSheet({ sheetId, columns: cleaned as any })
      toast.success("Columns updated")
      setColumnsOpen(false)
    } catch (err: any) {
      toast.error(err?.message || "Could not save columns")
    } finally {
      setSaving(false)
    }
  }

  function handleExport(fmt: "csv" | "xlsx") {
    if (!sheet) return
    const headers = columns.map((c) => c.name)
    const rows = (entries ?? []).map((e) =>
      columns.map((c) => formatCell(e.cells?.[c.id], c.type)),
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
                <h1 className="text-xl font-bold tracking-tight" data-testid="sheet-title">
                  {sheet.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {(entries ?? []).length} rows · {columns.length} columns
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={openColumns} data-testid="sheet-columns-btn">
              <Layers size={14} variant="Bulk" /> Columns
            </Button>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" data-testid="sheet-settings-btn" aria-label="Sheet settings">
                  <Setting2 size={16} variant="Bulk" />
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

        {/* Column manager */}
        <Dialog open={columnsOpen} onOpenChange={setColumnsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage columns</DialogTitle>
            </DialogHeader>
            <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {colDraft.map((c, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-secondary/40 p-3"
                  data-testid={`column-row-${i}`}
                >
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[160px] flex-1">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</Label>
                      <Input
                        value={c.name}
                        onChange={(e) => {
                          const next = [...colDraft]
                          next[i] = { ...c, name: e.target.value }
                          setColDraft(next)
                        }}
                        className="h-8"
                        data-testid={`column-name-${i}`}
                      />
                    </div>
                    <div className="w-[130px]">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</Label>
                      <select
                        value={c.type}
                        onChange={(e) => {
                          const next = [...colDraft]
                          next[i] = { ...c, type: e.target.value }
                          setColDraft(next)
                        }}
                        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                        data-testid={`column-type-${i}`}
                      >
                        {COLUMN_TYPES.map((tt) => (
                          <option key={tt.value} value={tt.value}>
                            {tt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex h-8 items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={!!c.required}
                        onChange={(e) => {
                          const next = [...colDraft]
                          next[i] = { ...c, required: e.target.checked }
                          setColDraft(next)
                        }}
                        className="h-3.5 w-3.5 rounded accent-[var(--primary)]"
                      />
                      Required
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setColDraft(colDraft.filter((_, idx) => idx !== i))}
                      data-testid={`column-delete-${i}`}
                    >
                      <Trash2 size={14} variant="Bulk" />
                    </Button>
                  </div>
                  {c.type === "select" && (
                    <div className="mt-2">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Options (comma separated)
                      </Label>
                      <Input
                        value={(c.options || []).join(", ")}
                        onChange={(e) => {
                          const next = [...colDraft]
                          next[i] = {
                            ...c,
                            options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean),
                          }
                          setColDraft(next)
                        }}
                        className="h-8"
                        placeholder="Draft, Submitted, Approved"
                      />
                    </div>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() =>
                  setColDraft([...colDraft, { id: slugId("column"), name: "", type: "text" }])
                }
                data-testid="add-column-btn"
              >
                <Plus size={14} variant="Bulk" /> Add column
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setColumnsOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveColumns} disabled={saving} data-testid="save-columns-btn">
                {saving ? <Loader2 size={14} variant="Bulk" className="animate-spin" /> : "Save columns"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Desktop / tablet: table view */}
        <div className="hidden overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-[var(--elev-1)] sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  {columns.map((c) => (
                    <th key={c.id} className="whitespace-nowrap px-4 py-3">
                      {c.name}
                      {c.required && <span className="ml-1 text-primary">*</span>}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(entries ?? []).map((e) => (
                  <tr key={e._id} className="transition-colors hover:bg-secondary/40">
                    {columns.map((c) => (
                      <td key={c.id} className="px-4 py-1.5 align-middle">
                        <CellEditor
                          column={c}
                          value={e.cells?.[c.id]}
                          onChange={(v) => handleCellEdit(e._id, c.id, v)}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right">
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
                  <td colSpan={columns.length + 1} className="bg-secondary/30 px-4 py-3">
                    <form onSubmit={handleAddRow} className="flex flex-wrap items-end gap-2">
                      {columns.map((c) => (
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
                        <Plus size={12} variant="Bulk" /> Add row
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
            <div key={e._id} className="tx-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  {columns.map((c) => (
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
            className="space-y-2 rounded-[var(--radius)] border border-dashed border-border bg-card/60 p-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Add row
            </p>
            {columns.map((c) => (
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
    : "h-8 text-sm border-transparent bg-transparent shadow-none focus-visible:ring-1 focus-visible:border-input"

  if (column.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input accent-[var(--primary)]"
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
        className={`font-numeric ${cls}`}
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
