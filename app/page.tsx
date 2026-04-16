import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LanguageSwitcher } from "@/components/language-switcher"
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Layers,
  Link2,
  Receipt,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"

const featureIcons = {
  budget: Target,
  invoice: FileText,
  expense: Receipt,
  book: BookOpen,
  connected: Link2,
  storage: Shield,
} as const

export default async function LandingPage() {
  const t = await getTranslations("landing")
  const nav = await getTranslations("nav")

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-foreground text-background">
              <Wallet className="h-4 w-4 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Finflow</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { href: "#features", label: nav("features") },
              { href: "#pricing", label: nav("pricing") },
              { href: "#testimonials", label: nav("testimonials") },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/onboarding">{nav("signIn")}</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link href="/onboarding">
                {nav("getStarted")}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-surface-grid" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-dot-grid [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -left-20 top-40 -z-10 hidden h-96 w-96 rounded-full bg-accent/20 blur-3xl md:block" aria-hidden />
        <div className="pointer-events-none absolute -right-20 top-20 -z-10 hidden h-96 w-96 rounded-full bg-chart-3/10 blur-3xl md:block" aria-hidden />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="secondary"
              className="mb-6 inline-flex animate-fade-down rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs"
            >
              <Sparkles className="mr-1.5 h-3 w-3 text-accent" />
              {t("badge")}
            </Badge>
            <h1 className="animate-fade-up text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              {t("hero.title")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-br from-accent to-emerald-600 bg-clip-text text-transparent">
                  {t("hero.highlight")}
                </span>
                <span
                  className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-gradient-to-r from-accent/20 via-accent/30 to-accent/20 sm:h-4"
                  aria-hidden
                />
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-pretty text-base leading-relaxed text-muted-foreground delay-150 sm:text-lg">
              {t("hero.description")}
            </p>
            <div className="mt-8 flex animate-fade-up flex-col items-center justify-center gap-3 delay-300 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group rounded-full shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Link href="/onboarding">
                  {t("hero.startFree")}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="#features">{t("hero.seeHowItWorks")}</Link>
              </Button>
            </div>
            <div className="mt-8 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground delay-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                {t("hero.benefits.freeForever")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                {t("hero.benefits.storage")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                {t("hero.benefits.setup")}
              </span>
            </div>
          </div>

          {/* Dashboard preview with floating cards */}
          <div className="relative mx-auto mt-16 max-w-5xl animate-scale-in delay-300">
            <div
              className="absolute inset-x-0 -bottom-10 -top-10 -z-10 bg-gradient-to-b from-accent/15 via-accent/5 to-transparent blur-3xl"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-foreground/10 ring-1 ring-foreground/5">
              <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="ml-4 flex h-5 max-w-xs flex-1 items-center gap-1.5 rounded-md bg-background px-2 text-[10px] text-muted-foreground">
                  <span className="inline-block h-1 w-1 rounded-full bg-accent" /> finflow.app/dashboard
                </div>
              </div>
              <div className="grid grid-cols-6 gap-3 p-6 sm:p-8">
                <div className="col-span-6 rounded-xl border border-border bg-background p-5 sm:col-span-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total balance</p>
                      <p className="mt-2 font-numeric text-3xl font-semibold">€12,480.50</p>
                      <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                        <TrendingUp className="h-3 w-3" />
                        +12.4% this month
                      </div>
                    </div>
                    <div className="hidden items-center gap-1 sm:flex">
                      {["7D", "1M", "3M", "1Y"].map((k, i) => (
                        <span
                          key={k}
                          className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                            i === 1 ? "bg-foreground text-background" : "text-muted-foreground"
                          }`}
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 grid h-28 grid-cols-12 items-end gap-1.5">
                    {[45, 60, 40, 75, 55, 80, 65, 90, 70, 85, 95, 100].map((h, i) => (
                      <div
                        key={i}
                        className="rounded-sm bg-gradient-to-t from-accent/30 to-accent transition-all hover:from-accent/50 hover:to-accent"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="col-span-6 space-y-3 sm:col-span-2">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Income</p>
                      <TrendingUp className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <p className="mt-1 font-numeric text-lg font-semibold">€5,240</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Expenses</p>
                      <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    </div>
                    <p className="mt-1 font-numeric text-lg font-semibold">€3,120</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-foreground to-neutral-800 p-4 text-background">
                    <p className="text-xs font-medium text-background/60">Savings</p>
                    <p className="mt-1 font-numeric text-lg font-semibold">€2,120</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="pointer-events-none absolute -left-4 top-24 hidden animate-float rounded-2xl border border-border bg-card p-3 shadow-md sm:block md:-left-16 md:top-32" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium">Invoice paid</p>
                  <p className="font-numeric text-[10px] text-muted-foreground">+€2,400.00</p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-4 bottom-20 hidden animate-float rounded-2xl border border-border bg-card p-3 shadow-md sm:block md:-right-16" style={{ animationDelay: "1.6s" }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium">Budget on track</p>
                  <p className="text-[10px] text-muted-foreground">92% of October target</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="relative mt-16 overflow-hidden">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Trusted by teams, freelancers and associations
              </p>
            </div>
            <div className="relative mt-6 flex [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
              <div className="animate-marquee flex shrink-0 items-center gap-12 pr-12">
                {["Atelier", "NordFund", "GreenPath", "Varso", "Lumen", "Pivot", "Norma", "Kernel"].concat([
                  "Atelier",
                  "NordFund",
                  "GreenPath",
                  "Varso",
                  "Lumen",
                  "Pivot",
                  "Norma",
                  "Kernel",
                ]).map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="text-lg font-semibold tracking-tight text-muted-foreground/60"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profiles */}
      <section className="border-t border-border bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="rounded-full bg-accent/10 px-3 py-1 text-accent hover:bg-accent/10">
              Tailored
            </Badge>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t("profiles.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("profiles.description")}</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2">
            <div className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                <Wallet className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{t("profiles.individual.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("profiles.individual.description")}</p>
              <ul className="mt-6 space-y-2.5">
                {(t.raw("profiles.individual.features") as string[]).map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-8 w-full rounded-full group-hover:border-foreground">
                <Link href="/onboarding?type=individual">
                  {t("profiles.individual.cta")}
                  <ArrowUpRight className="ml-1.5 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-foreground bg-gradient-to-br from-foreground to-neutral-800 p-8 text-background shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/30 blur-3xl transition-transform duration-700 group-hover:scale-125"
                aria-hidden
              />
              <Badge className="relative z-10 bg-accent text-accent-foreground">{t("profiles.business.badge")}</Badge>
              <div className="relative mt-5 flex h-11 w-11 items-center justify-center rounded-xl bg-background/10">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="relative mt-6 text-xl font-semibold">{t("profiles.business.title")}</h3>
              <p className="relative mt-2 text-sm text-background/70">{t("profiles.business.description")}</p>
              <ul className="relative mt-6 space-y-2.5">
                {(t.raw("profiles.business.features") as string[]).map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="relative mt-8 w-full rounded-full bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/onboarding?type=business">
                  {t("profiles.business.cta")}
                  <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative border-t border-border bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="rounded-full bg-accent/10 px-3 py-1 text-accent hover:bg-accent/10">
              Features
            </Badge>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t("features.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("features.description")}</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(featureIcons) as [keyof typeof featureIcons, (typeof featureIcons)[keyof typeof featureIcons]][]).map(
              ([key, Icon], idx) => (
                <div
                  key={key}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/10 hover:shadow-md"
                >
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/0 blur-2xl transition-all duration-500 group-hover:bg-accent/10"
                    aria-hidden
                  />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent transition-transform group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="relative mt-5 text-lg font-semibold">{t(`features.items.${key}.title`)}</h3>
                  <p className="relative mt-2 text-sm text-muted-foreground">
                    {t(`features.items.${key}.description`)}
                  </p>
                  <div className="relative mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    Learn more
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Book system */}
      <section className="border-t border-border bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="secondary" className="rounded-full bg-accent/10 text-accent hover:bg-accent/10">
                {t("bookSystem.badge")}
              </Badge>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("bookSystem.title")}
              </h2>
              <p className="mt-4 text-muted-foreground">{t("bookSystem.description")}</p>
              <ul className="mt-6 space-y-2.5">
                {(t.raw("bookSystem.features") as string[]).map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="group mt-8 rounded-full">
                <Link href="/onboarding">
                  {t("bookSystem.cta")}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div
                className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-accent/20 via-transparent to-chart-3/10 blur-2xl"
                aria-hidden
              />
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg ring-1 ring-foreground/5">
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    finances-q4.book
                  </span>
                  <span>synced just now</span>
                </div>
                <div className="divide-y divide-border font-numeric text-sm">
                  <div className="grid grid-cols-4 gap-2 bg-muted/20 px-4 py-2 text-xs font-semibold text-muted-foreground">
                    <span>Date</span>
                    <span>Description</span>
                    <span>Category</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {[
                    ["04 Oct", "Client invoice #1082", "Income", "+€2,400.00", "text-accent"],
                    ["02 Oct", "Office supplies", "Expense", "-€187.50", "text-foreground"],
                    ["29 Sep", "Subscription renewal", "Expense", "-€49.00", "text-foreground"],
                    ["27 Sep", "Consulting retainer", "Income", "+€1,200.00", "text-accent"],
                    ["25 Sep", "Transport", "Expense", "-€72.40", "text-foreground"],
                  ].map(([date, desc, cat, amt, color], idx) => (
                    <div
                      key={desc}
                      className="grid grid-cols-4 items-center gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-muted/40"
                    >
                      <span className="text-muted-foreground">{date}</span>
                      <span className="truncate">{desc}</span>
                      <span className="text-muted-foreground">{cat}</span>
                      <span className={`text-right font-medium ${color}`}>{amt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative overflow-hidden border-y border-border bg-foreground py-16 text-background">
        <div
          className="pointer-events-none absolute inset-0 -z-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 40%, rgb(34 197 94 / 0.25), transparent 50%), radial-gradient(circle at 80% 60%, rgb(37 99 235 / 0.18), transparent 45%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
          {(["activeUsers", "invoices", "uptime", "rating"] as const).map(key => (
            <div key={key} className="text-center sm:text-left">
              <div className="font-numeric text-3xl font-semibold sm:text-4xl">{t(`stats.${key}.value`)}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-background/60">
                {t(`stats.${key}.label`)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="rounded-full bg-accent/10 px-3 py-1 text-accent hover:bg-accent/10">
              Pricing
            </Badge>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t("pricing.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("pricing.description")}</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
            {(["free", "pro", "enterprise"] as const).map(plan => {
              const isPro = plan === "pro"
              return (
                <div
                  key={plan}
                  className={
                    isPro
                      ? "group relative rounded-2xl border-2 border-foreground bg-card p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
                      : "group relative rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
                  }
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="rounded-full bg-accent text-accent-foreground shadow-sm">
                        {t("pricing.plans.pro.badge")}
                      </Badge>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold">{t(`pricing.plans.${plan}.name`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`pricing.plans.${plan}.description`)}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-numeric text-4xl font-semibold">€{t(`pricing.plans.${plan}.price`)}</span>
                    <span className="text-sm text-muted-foreground">{t("pricing.perMonth")}</span>
                  </div>
                  <ul className="mt-6 space-y-2.5">
                    {(t.raw(`pricing.plans.${plan}.features`) as string[]).map(feature => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={isPro ? "default" : "outline"}
                    className="mt-8 w-full rounded-full group-hover:-translate-y-0"
                  >
                    <Link href="/onboarding">{t(`pricing.plans.${plan}.cta`)}</Link>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-t border-border bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="rounded-full bg-accent/10 px-3 py-1 text-accent hover:bg-accent/10">
              Testimonials
            </Badge>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("testimonials.title")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("testimonials.description")}</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {(t.raw("testimonials.items") as Array<{ quote: string; author: string; role: string }>).map(item => (
              <figure
                key={item.author}
                className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="flex gap-0.5 text-accent">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-foreground">"{item.quote}"</blockquote>
                </div>
                <figcaption className="mt-6 border-t border-border pt-4">
                  <div className="text-sm font-semibold">{item.author}</div>
                  <div className="text-xs text-muted-foreground">{item.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-border bg-foreground py-20 text-background sm:py-28">
        <div className="absolute inset-0 -z-0 opacity-40" aria-hidden>
          <div className="absolute -left-20 top-1/2 h-96 w-96 -translate-y-1/2 animate-pulse-soft rounded-full bg-accent/40 blur-3xl" />
          <div
            className="absolute -right-20 top-1/3 h-96 w-96 -translate-y-1/2 animate-pulse-soft rounded-full bg-chart-3/20 blur-3xl"
            style={{ animationDelay: "1.5s" }}
          />
        </div>
        <div className="bg-noise absolute inset-0 -z-0 opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{t("cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-background/70">{t("cta.description")}</p>
          <Button
            asChild
            size="lg"
            className="group mt-8 rounded-full bg-background text-foreground shadow-lg hover:-translate-y-0.5 hover:bg-background/95 hover:shadow-xl"
          >
            <Link href="/onboarding">
              {t("cta.button")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <Wallet className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold">Finflow</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <Link href="#" className="transition-colors hover:text-foreground">
              {t("footer.privacy")}
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              {t("footer.terms")}
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              {t("footer.contact")}
            </Link>
            <span>© {t("footer.copyright")}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
