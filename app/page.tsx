import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LanguageSwitcher } from "@/components/language-switcher"
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
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
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Finflow</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {nav("features")}
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {nav("pricing")}
            </Link>
            <Link
              href="#testimonials"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {nav("testimonials")}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/onboarding">{nav("signIn")}</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link href="/onboarding">
                {nav("getStarted")}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-grid">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="secondary"
              className="mb-6 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <Sparkles className="mr-1.5 h-3 w-3 text-accent" />
              {t("badge")}
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              {t("hero.title")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-accent">{t("hero.highlight")}</span>
                <span className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-accent/15 sm:h-4" aria-hidden />
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("hero.description")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/onboarding">
                  {t("hero.startFree")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="#features">{t("hero.seeHowItWorks")}</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
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

          {/* Dashboard preview */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="absolute inset-x-0 -bottom-10 -top-10 -z-10 bg-gradient-to-b from-accent/10 via-accent/5 to-transparent blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-foreground/10">
              <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="ml-4 h-5 flex-1 max-w-xs rounded-md bg-card" />
              </div>
              <div className="grid grid-cols-3 gap-4 p-6 sm:p-8">
                <div className="col-span-3 rounded-xl border border-border bg-background p-5 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total balance</p>
                  <p className="mt-2 font-numeric text-3xl font-semibold">€12,480.50</p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                    <TrendingUp className="h-3 w-3" />
                    +12.4% this month
                  </div>
                  <div className="mt-6 grid h-28 grid-cols-12 items-end gap-1.5">
                    {[45, 60, 40, 75, 55, 80, 65, 90, 70, 85, 95, 100].map((h, i) => (
                      <div
                        key={i}
                        className="rounded-sm bg-gradient-to-t from-accent/40 to-accent"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="col-span-3 space-y-3 sm:col-span-1">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs font-medium text-muted-foreground">Income</p>
                    <p className="mt-1 font-numeric text-lg font-semibold">€5,240</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs font-medium text-muted-foreground">Expenses</p>
                    <p className="mt-1 font-numeric text-lg font-semibold">€3,120</p>
                  </div>
                  <div className="rounded-xl border border-border bg-foreground p-4 text-background">
                    <p className="text-xs font-medium text-background/60">Savings</p>
                    <p className="mt-1 font-numeric text-lg font-semibold">€2,120</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profiles */}
      <section className="border-t border-border bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t("profiles.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("profiles.description")}</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-8 transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Wallet className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{t("profiles.individual.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("profiles.individual.description")}</p>
              <ul className="mt-6 space-y-2">
                {(t.raw("profiles.individual.features") as string[]).map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-8 w-full rounded-full">
                <Link href="/onboarding?type=individual">
                  {t("profiles.individual.cta")}
                  <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative rounded-2xl border border-foreground bg-foreground p-8 text-background transition-shadow hover:shadow-lg">
              <Badge className="absolute right-6 top-6 bg-accent text-accent-foreground">
                {t("profiles.business.badge")}
              </Badge>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/10">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{t("profiles.business.title")}</h3>
              <p className="mt-2 text-sm text-background/70">{t("profiles.business.description")}</p>
              <ul className="mt-6 space-y-2">
                {(t.raw("profiles.business.features") as string[]).map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full rounded-full bg-background text-foreground hover:bg-background/90">
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
      <section id="features" className="border-t border-border bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t("features.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("features.description")}</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(featureIcons) as [keyof typeof featureIcons, (typeof featureIcons)[keyof typeof featureIcons]][]).map(
              ([key, Icon]) => (
                <div
                  key={key}
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{t(`features.items.${key}.title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(`features.items.${key}.description`)}</p>
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
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 rounded-full">
                <Link href="/onboarding">
                  {t("bookSystem.cta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <div className="border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground">
                finances-q4.book
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
                ].map(([date, desc, cat, amt, color]) => (
                  <div key={desc} className="grid grid-cols-4 items-center gap-2 px-4 py-2.5 text-xs">
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
      </section>

      {/* Stats */}
      <section className="border-t border-border bg-foreground py-16 text-background">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
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
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t("pricing.title")}</h2>
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
                      ? "relative rounded-2xl border-2 border-foreground bg-card p-8 shadow-md"
                      : "relative rounded-2xl border border-border bg-card p-8"
                  }
                >
                  {isPro && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent text-accent-foreground">
                      {t("pricing.plans.pro.badge")}
                    </Badge>
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
                    className="mt-8 w-full rounded-full"
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
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("testimonials.title")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("testimonials.description")}</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {(t.raw("testimonials.items") as Array<{ quote: string; author: string; role: string }>).map(item => (
              <figure
                key={item.author}
                className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6"
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
      <section className="relative overflow-hidden border-t border-border bg-foreground py-20 text-background sm:py-24">
        <div className="absolute inset-0 -z-0 opacity-30">
          <div className="absolute -left-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-accent/40 blur-3xl" />
          <div className="absolute -right-20 top-1/3 h-80 w-80 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{t("cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-background/70">{t("cta.description")}</p>
          <Button asChild size="lg" className="mt-8 rounded-full bg-background text-foreground hover:bg-background/90">
            <Link href="/onboarding">
              {t("cta.button")}
              <ArrowRight className="ml-2 h-4 w-4" />
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
            <Link href="#" className="hover:text-foreground">
              {t("footer.privacy")}
            </Link>
            <Link href="#" className="hover:text-foreground">
              {t("footer.terms")}
            </Link>
            <Link href="#" className="hover:text-foreground">
              {t("footer.contact")}
            </Link>
            <span>© {t("footer.copyright")}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
