"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/glass-card"
import { cn } from "@/lib/utils"
import { Plus, Trash } from "@/components/iconsax"
import {
  amountInFrenchWords,
  RECU_DON_CATEGORIES,
  FORME_LABELS,
  NATURE_LABELS,
  MODE_LABELS,
} from "@/lib/documents/recu-don"
import { budgetTotals } from "@/lib/documents/budget-equilibre"

function Section({
  number,
  title,
  hint,
  children,
}: {
  number: number
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center gap-3 border-b border-border/60 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {number}
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </GlassCard>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-sm transition-colors hover:bg-muted/50">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-3.5 w-3.5 accent-[var(--primary)]"
      />
      <span>{label}</span>
    </label>
  )
}

/* ============================ REÇU DE DONS ============================ */
export function RecuDonEditor({
  data,
  onChange,
}: {
  data: any
  onChange: (next: any) => void
}) {
  const set = (path: string, value: any) => {
    const next = JSON.parse(JSON.stringify(data ?? {}))
    const parts = path.split(".")
    let cur = next
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] == null) cur[parts[i]] = {}
      cur = cur[parts[i]]
    }
    cur[parts[parts.length - 1]] = value
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <Section number={1} title="Bénéficiaire du don" hint="L'organisme qui reçoit le don">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="N° du reçu">
            <Input value={data.receiptNumber ?? ""} onChange={(e) => set("receiptNumber", e.target.value)} placeholder="2026-001" />
          </Field>
          <Field label="Dénomination de l'organisme">
            <Input value={data.orgName ?? ""} onChange={(e) => set("orgName", e.target.value)} />
          </Field>
        </div>
        <Field label="Adresse complète">
          <Input value={data.orgAddress ?? ""} onChange={(e) => set("orgAddress", e.target.value)} />
        </Field>
        <Field label="Objet de l'organisme">
          <Input value={data.orgObject ?? ""} onChange={(e) => set("orgObject", e.target.value)} />
        </Field>
        <Field label="Catégorie de l'organisme">
          <select
            value={data.orgCategory ?? ""}
            onChange={(e) => set("orgCategory", e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {RECU_DON_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Régime fiscal applicable">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Check label="Art. 200 CGI (impôt sur le revenu)" checked={!!data.regime?.art200} onChange={(v) => set("regime.art200", v)} />
            <Check label="Art. 238 bis CGI (entreprises)" checked={!!data.regime?.art238bis} onChange={(v) => set("regime.art238bis", v)} />
            <Check label="Art. 978 CGI (IFI)" checked={!!data.regime?.art978} onChange={(v) => set("regime.art978", v)} />
          </div>
        </Field>
      </Section>

      <Section number={2} title="Donateur">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Civilité / forme">
            <Input value={data.donorCivility ?? ""} onChange={(e) => set("donorCivility", e.target.value)} placeholder="M., Mme, Société…" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Nom et prénom (ou raison sociale)">
              <Input value={data.donorName ?? ""} onChange={(e) => set("donorName", e.target.value)} />
            </Field>
          </div>
        </div>
        <Field label="Adresse du donateur">
          <Input value={data.donorAddress ?? ""} onChange={(e) => set("donorAddress", e.target.value)} />
        </Field>
      </Section>

      <Section number={3} title="Don">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Montant (€)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={data.amount ?? 0}
              onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
            />
          </Field>
          <Field label="Date du versement">
            <Input type="date" value={data.donDate ?? ""} onChange={(e) => set("donDate", e.target.value)} />
          </Field>
        </div>
        {data.amount > 0 ? (
          <div className="rounded-lg bg-brand-purple-soft px-3 py-2 text-sm">
            <span className="text-muted-foreground">Montant en lettres : </span>
            <span className="font-medium text-primary">{amountInFrenchWords(Number(data.amount) || 0)}</span>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Forme du don">
            <div className="flex flex-col gap-1.5">
              {(Object.keys(FORME_LABELS) as Array<keyof typeof FORME_LABELS>).map((k) => (
                <Pill key={k} active={data.forme === k} onClick={() => set("forme", k)}>{FORME_LABELS[k]}</Pill>
              ))}
            </div>
          </Field>
          <Field label="Nature du don">
            <div className="flex flex-col gap-1.5">
              {(Object.keys(NATURE_LABELS) as Array<keyof typeof NATURE_LABELS>).map((k) => (
                <Pill key={k} active={data.nature === k} onClick={() => set("nature", k)}>{NATURE_LABELS[k]}</Pill>
              ))}
            </div>
          </Field>
          <Field label="Mode de versement">
            <div className="flex flex-col gap-1.5">
              {(Object.keys(MODE_LABELS) as Array<keyof typeof MODE_LABELS>).map((k) => (
                <Pill key={k} active={data.modeVersement === k} onClick={() => set("modeVersement", k)}>{MODE_LABELS[k]}</Pill>
              ))}
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Check label="Abandon de revenus ou de produits" checked={!!data.abandonRevenus} onChange={(v) => set("abandonRevenus", v)} />
          <Check label="Frais engagés par les bénévoles (renoncement au remboursement)" checked={!!data.fraisBenevoles} onChange={(v) => set("fraisBenevoles", v)} />
        </div>
      </Section>

      <Section number={4} title="Signature">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nom du signataire">
            <Input value={data.signatoryName ?? ""} onChange={(e) => set("signatoryName", e.target.value)} />
          </Field>
          <Field label="Qualité">
            <Input value={data.signatoryQuality ?? ""} onChange={(e) => set("signatoryQuality", e.target.value)} placeholder="Président(e), Trésorier(ère)…" />
          </Field>
          <Field label="Fait à">
            <Input value={data.signatureCity ?? ""} onChange={(e) => set("signatureCity", e.target.value)} />
          </Field>
          <Field label="Le">
            <Input type="date" value={data.signatureDate ?? ""} onChange={(e) => set("signatureDate", e.target.value)} />
          </Field>
        </div>
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Rappel légal : la délivrance irrégulière de reçus fiscaux est sanctionnée par une amende (art. 1740 A du CGI). Le reçu doit être conservé par le donateur.
        </p>
      </Section>
    </div>
  )
}

/* ============================ BUDGET À L'ÉQUILIBRE ============================ */
export function BudgetEditor({
  data,
  onChange,
}: {
  data: any
  onChange: (next: any) => void
}) {
  const totals = budgetTotals(data)
  const set = (path: string, value: any) => {
    const next = JSON.parse(JSON.stringify(data ?? {}))
    next[path] = value
    onChange(next)
  }
  const setLine = (side: "charges" | "produits", idx: number, key: "label" | "amount", value: any) => {
    const next = JSON.parse(JSON.stringify(data ?? {}))
    if (!Array.isArray(next[side])) next[side] = []
    next[side][idx] = { ...(next[side][idx] || {}), [key]: key === "amount" ? parseFloat(value) || 0 : value }
    onChange(next)
  }
  const addLine = (side: "charges" | "produits") => {
    const next = JSON.parse(JSON.stringify(data ?? {}))
    if (!Array.isArray(next[side])) next[side] = []
    next[side].push({ label: "", amount: 0 })
    onChange(next)
  }
  const removeLine = (side: "charges" | "produits", idx: number) => {
    const next = JSON.parse(JSON.stringify(data ?? {}))
    next[side] = (next[side] || []).filter((_: any, i: number) => i !== idx)
    onChange(next)
  }

  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0)
    } catch {
      return (n || 0).toFixed(2) + " €"
    }
  }

  const Column = ({ side, color }: { side: "charges" | "produits"; color: string }) => (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color }}>
          {side === "charges" ? "Charges (dépenses)" : "Produits (recettes)"}
        </h3>
        <span className="text-sm font-bold">{fmt(side === "charges" ? totals.totalCharges : totals.totalProduits)}</span>
      </div>
      <div className="space-y-2">
        {(data[side] ?? []).map((l: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={l.label ?? ""}
              onChange={(e) => setLine(side, i, "label", e.target.value)}
              className="flex-1 text-sm"
              placeholder="Libellé / compte"
            />
            <Input
              type="number"
              step="0.01"
              value={l.amount ?? 0}
              onChange={(e) => setLine(side, i, "amount", e.target.value)}
              className="w-28 text-right text-sm"
            />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLine(side, i)}>
              <Trash className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => addLine(side)}>
          <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
        </Button>
      </div>
    </GlassCard>
  )

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Association / structure">
            <Input value={data.association ?? ""} onChange={(e) => set("association", e.target.value)} />
          </Field>
          <Field label="Intitulé du budget">
            <Input value={data.scope ?? ""} onChange={(e) => set("scope", e.target.value)} placeholder="Budget annuel, Action X…" />
          </Field>
          <Field label="Exercice / année">
            <Input value={data.year ?? ""} onChange={(e) => set("year", e.target.value)} />
          </Field>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Column side="charges" color="var(--brand-purple)" />
        <Column side="produits" color="var(--success)" />
      </div>

      <GlassCard
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 p-5",
          totals.balanced ? "ring-1 ring-success/40" : "ring-1 ring-destructive/40",
        )}
      >
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Total charges : <b className="text-foreground">{fmt(totals.totalCharges)}</b></span>
          <span className="text-muted-foreground">Total produits : <b className="text-foreground">{fmt(totals.totalProduits)}</b></span>
        </div>
        <div
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold",
            totals.balanced ? "bg-brand-green-soft text-success" : "bg-destructive/10 text-destructive",
          )}
        >
          {totals.balanced
            ? "✓ Budget équilibré"
            : `Écart : ${fmt(Math.abs(totals.balance))} ${totals.balance > 0 ? "(excédent)" : "(déficit)"}`}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <Field label="Notes & hypothèses">
          <Textarea rows={4} value={data.notes ?? ""} onChange={(e) => set("notes", e.target.value)} className="resize-none" />
        </Field>
      </GlassCard>
    </div>
  )
}
