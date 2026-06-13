"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import CountUp from "react-countup"
import { useTranslations } from "next-intl"
import { GlassCard } from "@/components/glass-card"
import { ArrowUp, ArrowDown, Chart2, TrendUp, Activity } from "@/components/iconsax"
import { formatCurrency } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────────────────────
   reaviz must be loaded client-only (it imports d3 internals that break SSR).
   We use next/dynamic with ssr:false for safety in App Router.
   ───────────────────────────────────────────────────────────────────────── */

const StackedNormalizedAreaChart = dynamic(
  () => import("reaviz").then((m) => m.StackedNormalizedAreaChart),
  { ssr: false },
)
const StackedNormalizedAreaSeries = dynamic(
  () => import("reaviz").then((m) => m.StackedNormalizedAreaSeries),
  { ssr: false },
)
const SparklineChart = dynamic(
  () => import("reaviz").then((m) => m.SparklineChart),
  { ssr: false },
)
const RadialGauge = dynamic(() => import("reaviz").then((m) => m.RadialGauge), {
  ssr: false,
})
const RadialGaugeSeries = dynamic(
  () => import("reaviz").then((m) => m.RadialGaugeSeries),
  { ssr: false },
)
const BarChart = dynamic(() => import("reaviz").then((m) => m.BarChart), {
  ssr: false,
})
const BarSeries = dynamic(() => import("reaviz").then((m) => m.BarSeries), {
  ssr: false,
})
const Bar = dynamic(() => import("reaviz").then((m) => m.Bar), { ssr: false })
const Gradient = dynamic(() => import("reaviz").then((m) => m.Gradient), {
  ssr: false,
})
const GradientStop = dynamic(
  () => import("reaviz").then((m) => m.GradientStop),
  { ssr: false },
)

/* ─────────────────────────────────────────────────────────────────────────
   Types & helpers
   ───────────────────────────────────────────────────────────────────────── */

export type Txn = {
  date: number
  amount: number
  type: "income" | "expense"
  category?: string
}

function bucketByMonth(txns: Txn[]) {
  const buckets = new Map<string, { income: number; expense: number; date: Date }>()
  for (const t of txns) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const ref = buckets.get(key) ?? {
      income: 0,
      expense: 0,
      date: new Date(d.getFullYear(), d.getMonth(), 1),
    }
    if (t.type === "income") ref.income += t.amount
    else ref.expense += t.amount
    buckets.set(key, ref)
  }
  return Array.from(buckets.values()).sort((a, b) => +a.date - +b.date)
}

/* ─────────────────────────────────────────────────────────────────────────
   AdvancedNormalizedIncidentReport
   Stacked normalized area chart showing the income / expense composition
   over time. Pure CSS palette - no raw red/green.
   ───────────────────────────────────────────────────────────────────────── */

export function AdvancedNormalizedIncidentReport({
  transactions,
  currency = "EUR",
}: {
  transactions: Txn[]
  currency?: string
}) {
  const t = useTranslations("pages.reports")

  const series = React.useMemo(() => {
    const months = bucketByMonth(transactions)
    if (months.length === 0) return []
    return [
      {
        key: "income",
        data: months.map((m) => ({ key: m.date, data: m.income, id: `i-${+m.date}` })),
      },
      {
        key: "expense",
        data: months.map((m) => ({ key: m.date, data: m.expense, id: `e-${+m.date}` })),
      },
    ]
  }, [transactions])

  const totalIn = transactions.filter((x) => x.type === "income").reduce((a, b) => a + b.amount, 0)
  const totalOut = transactions.filter((x) => x.type === "expense").reduce((a, b) => a + b.amount, 0)
  const net = totalIn - totalOut

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-border/60 p-5">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Chart2 size={16} variant="Bulk" className="text-accent" />
            {t("composition.title")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("composition.subtitle")}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-right">
          <Metric
            label={t("totals.income")}
            value={totalIn}
            currency={currency}
            tone="positive"
          />
          <Metric
            label={t("totals.expenses")}
            value={totalOut}
            currency={currency}
            tone="negative"
          />
          <Metric
            label={t("totals.net")}
            value={net}
            currency={currency}
            tone={net >= 0 ? "positive" : "negative"}
          />
        </div>
      </div>

      <div className="relative h-[260px] w-full p-3">
        {series.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {t("noData")}
          </div>
        ) : (
          <StackedNormalizedAreaChart
            data={series as any}
            series={
              <StackedNormalizedAreaSeries
                colorScheme={["hsl(var(--chart-1))", "hsl(var(--chart-2))"]}
              />
            }
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border/60 px-5 py-3 text-xs">
        <LegendDot color="bg-[hsl(var(--chart-1))]" label={t("totals.income")} />
        <LegendDot color="bg-[hsl(var(--chart-2))]" label={t("totals.expenses")} />
      </div>
    </GlassCard>
  )
}

function Metric({
  label,
  value,
  currency,
  tone,
}: {
  label: string
  value: number
  currency: string
  tone: "positive" | "negative"
}) {
  const toneCls = tone === "positive" ? "text-accent" : "text-destructive"
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-numeric mt-0.5 text-sm font-semibold ${toneCls}`}>
        <CountUp
          end={value}
          duration={1.1}
          decimals={0}
          separator=" "
          formattingFn={(v) => formatCurrency(v, currency)}
        />
      </p>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   ActivityStatsCard — Sparkline + animated KPI + delta badge
   ───────────────────────────────────────────────────────────────────────── */

export function ActivityStatsCard({
  label,
  value,
  previousValue,
  series,
  currency,
  format = "currency",
  tone = "neutral",
  icon: Icon = Activity,
  delay = 0,
}: {
  label: string
  value: number
  previousValue?: number
  series: number[]
  currency?: string
  format?: "currency" | "number"
  tone?: "positive" | "negative" | "neutral"
  icon?: React.ComponentType<{ size?: number; variant?: any; className?: string }>
  delay?: number
}) {
  const delta = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / Math.abs(previousValue)) * 100
    : null
  const up = (delta ?? 0) >= 0

  const data = React.useMemo(
    () =>
      series.map((v, i) => ({
        key: new Date(2024, 0, i + 1),
        data: v,
        id: `s-${i}`,
      })),
    [series],
  )

  const toneCls =
    tone === "positive"
      ? "bg-accent/10 text-accent"
      : tone === "negative"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-foreground"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
    >
      <GlassCard className="group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p className="font-numeric mt-2 text-2xl font-semibold tracking-tight">
              <CountUp
                end={value}
                duration={1.2}
                decimals={format === "currency" ? 2 : 0}
                decimal=","
                separator=" "
                formattingFn={(v) =>
                  format === "currency" ? formatCurrency(v, currency ?? "EUR") : String(Math.round(v))
                }
              />
            </p>
            {delta !== null && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium">
                {up ? (
                  <ArrowUp size={10} variant="Bulk" className="text-accent" />
                ) : (
                  <ArrowDown size={10} variant="Bulk" className="text-destructive" />
                )}
                <span className={up ? "text-accent" : "text-destructive"}>
                  {Math.abs(delta).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneCls} transition-transform group-hover:scale-110`}
          >
            <Icon size={18} variant="Bulk" />
          </div>
        </div>
        <div className="-mx-2 mt-3 h-14">
          {data.length > 1 ? (
            <SparklineChart
              height={56}
              width={undefined as any}
              data={data as any}
            />
          ) : (
            <div className="flex h-full items-center text-[10px] text-muted-foreground">
              —
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   CategoryBreakdownBar — horizontal BarChart per category
   ───────────────────────────────────────────────────────────────────────── */

export function CategoryBreakdownBar({
  data,
  currency = "EUR",
}: {
  data: { category: string; amount: number }[]
  currency?: string
}) {
  const t = useTranslations("pages.reports")
  const series = data.map((d) => ({ key: d.category, data: d.amount, id: d.category }))
  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 p-5">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <TrendUp size={16} variant="Bulk" className="text-accent" />
            {t("byCategory")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("totals.expenses")} · {currency}
          </p>
        </div>
      </div>
      <div className="h-[260px] w-full p-3">
        {series.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {t("noData")}
          </div>
        ) : (
          <BarChart
            data={series as any}
            series={
              <BarSeries
                bar={
                  <Bar
                    gradient={
                      <Gradient>
                        <GradientStop offset="0%" stopOpacity={0.95} />
                        <GradientStop offset="100%" stopOpacity={0.6} />
                      </Gradient>
                    }
                  />
                }
                colorScheme={["hsl(var(--chart-1))"]}
              />
            }
          />
        )}
      </div>
    </GlassCard>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   BudgetGauge — RadialGauge of usage % per budget
   ───────────────────────────────────────────────────────────────────────── */

export function BudgetGauge({
  label,
  spent,
  total,
  currency = "EUR",
}: {
  label: string
  spent: number
  total: number
  currency?: string
}) {
  const pct = total > 0 ? Math.min(100, (spent / total) * 100) : 0
  return (
    <GlassCard className="p-5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="relative mx-auto mt-2 h-32 w-32">
        <RadialGauge
          width={128}
          height={128}
          minValue={0}
          maxValue={100}
          data={[{ key: label, data: pct } as any]}
          series={<RadialGaugeSeries colorScheme={["hsl(var(--chart-1))"]} />}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-numeric text-base font-semibold">{pct.toFixed(0)}%</p>
          <p className="text-[10px] text-muted-foreground">
            {formatCurrency(spent, currency)} / {formatCurrency(total, currency)}
          </p>
        </div>
      </div>
    </GlassCard>
  )
}
