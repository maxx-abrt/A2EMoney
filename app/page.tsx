"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslations } from "next-intl"
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Menu,
  PieChart,
  Receipt,
  Shield,
  Sparkles,
  User,
  X,
  Wallet,
  TrendingUp,
  FileSpreadsheet,
  Scale,
  Link2,
  Upload,
  Download,
  Zap,
  Globe,
  Lock,
} from "lucide-react"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-accent shadow-sm">
              <Wallet className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Finflow</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4">
              {t('nav.features')}
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4">
              {t('nav.pricing')}
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4">
              {t('nav.testimonials')}
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher variant="ghost" size="icon" className="rounded-lg border border-transparent hover:border-border" />
            <Button variant="ghost" asChild className="font-medium">
              <Link href="/dashboard">{t('nav.signIn')}</Link>
            </Button>
            <Button asChild className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all font-semibold">
              <Link href="/onboarding">{t('nav.getStarted')}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="rounded-lg border border-border p-2 transition-colors hover:bg-muted md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="space-y-1 px-4 py-4">
              <Link href="#features" className="block rounded-lg border border-transparent px-3 py-2 text-sm font-medium hover:border-border hover:bg-muted">
                {t('nav.features')}
              </Link>
              <Link href="#pricing" className="block rounded-lg border border-transparent px-3 py-2 text-sm font-medium hover:border-border hover:bg-muted">
                {t('nav.pricing')}
              </Link>
              <Link href="#testimonials" className="block rounded-lg border border-transparent px-3 py-2 text-sm font-medium hover:border-border hover:bg-muted">
                {t('nav.testimonials')}
              </Link>
              <div className="flex flex-col gap-2 pt-4">
                <div className="flex justify-center pb-2">
                  <LanguageSwitcher variant="outline" size="default" className="w-full rounded-lg border" />
                </div>
                <Button variant="outline" asChild className="w-full rounded-lg border font-medium">
                  <Link href="/dashboard">{t('nav.signIn')}</Link>
                </Button>
                <Button asChild className="w-full shadow-sm font-semibold">
                  <Link href="/onboarding">{t('nav.getStarted')}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Pixel art decorative background */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute top-20 left-10 w-4 h-4 bg-accent" />
          <div className="absolute top-24 left-14 w-2 h-2 bg-accent" />
          <div className="absolute top-40 right-20 w-6 h-6 bg-chart-3" />
          <div className="absolute top-44 right-14 w-2 h-2 bg-chart-3" />
          <div className="absolute bottom-40 left-1/4 w-4 h-4 bg-chart-4" />
          <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-accent" />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 shadow-sm">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">{t('landing.badge')}</span>
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t('landing.hero.title')}{" "}
              <span className="relative inline-block">
                <span className="relative z-10">{t('landing.hero.highlight')}</span>
                <span className="absolute bottom-2 left-0 h-3 w-full bg-accent/40 z-0" />
              </span>
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground sm:text-xl leading-relaxed">
              {t('landing.hero.description')}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-base font-semibold px-8">
                <Link href="/onboarding">
                  {t('landing.hero.startFree')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto rounded-lg border text-base font-medium">
                <Link href="#features">
                  {t('landing.hero.seeHowItWorks')}
                </Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
              {[
                t('landing.hero.benefits.freeForever'),
                t('landing.hero.benefits.storage'),
                t('landing.hero.benefits.setup'),
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual - Dashboard Preview */}
          <div className="mt-16 sm:mt-20">
            <div className="relative mx-auto max-w-5xl">
              <Card className="relative overflow-hidden rounded-lg border shadow-lg">
                <CardContent className="p-0">
                  <DashboardPreview />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Selection Showcase */}
      <section className="border-y-2 border-border bg-muted py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.profiles.title')}
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              {t('landing.profiles.description')}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Card className="group relative overflow-hidden rounded-lg border bg-card transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-secondary">
                  <User className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold">{t('landing.profiles.individual.title')}</h3>
                <p className="mt-2 text-muted-foreground">
                  {t('landing.profiles.individual.description')}
                </p>
                <ul className="mt-6 space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                      <div className="flex h-5 w-5 items-center justify-center bg-accent">
                        <CheckCircle2 className="h-3 w-3 text-accent-foreground" />
                      </div>
                      {t(`landing.profiles.individual.features.${i}`)}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-8 w-full rounded-lg border font-semibold" asChild>
                  <Link href="/onboarding?type=individual">
                    {t('landing.profiles.individual.cta')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden rounded-lg border bg-card transition-all shadow-sm ring-1 ring-accent hover:shadow-md hover:-translate-y-0.5">
              <div className="absolute top-0 right-0 bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                {t('landing.profiles.business.badge')}
              </div>
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-lg border border-accent bg-accent/10">
                  <Building2 className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold">{t('landing.profiles.business.title')}</h3>
                <p className="mt-2 text-muted-foreground">
                  {t('landing.profiles.business.description')}
                </p>
                <ul className="mt-6 space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                      <div className="flex h-5 w-5 items-center justify-center bg-accent">
                        <CheckCircle2 className="h-3 w-3 text-accent-foreground" />
                      </div>
                      {t(`landing.profiles.business.features.${i}`)}
                    </li>
                  ))}
                </ul>
                <Button className="mt-8 w-full shadow-sm font-semibold" asChild>
                  <Link href="/onboarding?type=business">
                    {t('landing.profiles.business.cta')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.features.title')}
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              {t('landing.features.description')}
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: PieChart,
                titleKey: 'budget',
                color: 'bg-chart-3',
              },
              {
                icon: FileText,
                titleKey: 'invoice',
                color: 'bg-accent',
              },
              {
                icon: Receipt,
                titleKey: 'expense',
                color: 'bg-chart-4',
              },
              {
                icon: FileSpreadsheet,
                titleKey: 'book',
                color: 'bg-chart-5',
              },
              {
                icon: Link2,
                titleKey: 'connected',
                color: 'bg-chart-3',
              },
              {
                icon: Upload,
                titleKey: 'storage',
                color: 'bg-accent',
              },
            ].map((feature) => (
              <Card key={feature.titleKey} className="group rounded-lg border transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-border ${feature.color}`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold">{t(`landing.features.items.${feature.titleKey}.title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(`landing.features.items.${feature.titleKey}.description`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Book System Showcase */}
      <section className="border-y-2 border-border bg-muted py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium">
                <Zap className="h-4 w-4 text-accent" />
                <span>{t('landing.bookSystem.badge')}</span>
              </div>
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.bookSystem.title')}
              </h2>
              <p className="mt-4 text-pretty text-lg text-muted-foreground leading-relaxed">
                {t('landing.bookSystem.description')}
              </p>
              <ul className="mt-8 space-y-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center bg-accent">
                      <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <span className="text-sm font-medium">{t(`landing.bookSystem.features.${i}`)}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all font-semibold" asChild>
                <Link href="/onboarding">
                  {t('landing.bookSystem.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <Card className="relative overflow-hidden rounded-lg border shadow-lg">
                <CardContent className="p-0">
                  <BookPreview />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: t('landing.stats.activeUsers.value'), label: t('landing.stats.activeUsers.label'), key: 'activeUsers' },
              { value: t('landing.stats.invoices.value'), label: t('landing.stats.invoices.label'), key: 'invoices' },
              { value: t('landing.stats.uptime.value'), label: t('landing.stats.uptime.label'), key: 'uptime' },
              { value: t('landing.stats.rating.value'), label: t('landing.stats.rating.label'), key: 'rating' },
            ].map((stat) => (
              <div key={stat.key} className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
                <div className="font-mono text-4xl font-bold tracking-tight text-accent">{stat.value}</div>
                <div className="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-y-2 border-border bg-muted py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.pricing.title')}
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              {t('landing.pricing.description')}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                planKey: 'free',
                price: '0',
                popular: false,
                featureCount: 5,
              },
              {
                planKey: 'pro',
                price: '19',
                popular: true,
                featureCount: 6,
              },
              {
                planKey: 'enterprise',
                price: '49',
                popular: false,
                featureCount: 6,
              },
            ].map((plan) => (
              <Card key={plan.planKey} className={`relative rounded-lg border bg-card ${plan.popular ? "shadow-sm ring-1 ring-accent" : "shadow-sm"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-accent px-4 py-1 text-xs font-bold text-accent-foreground">
                      {t(`landing.pricing.plans.${plan.planKey}.badge`)}
                    </span>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-bold">{t(`landing.pricing.plans.${plan.planKey}.name`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`landing.pricing.plans.${plan.planKey}.description`)}</p>
                  <div className="mt-4">
                    <span className="font-mono text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">{t('landing.pricing.perMonth')}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {Array.from({ length: plan.featureCount }).map((_, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        <span>{t(`landing.pricing.plans.${plan.planKey}.features.${i}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`mt-6 w-full font-semibold ${plan.popular ? "shadow-sm" : ""}`} 
                    variant={plan.popular ? "default" : "outline"} 
                    asChild
                  >
                    <Link href="/onboarding">{t(`landing.pricing.plans.${plan.planKey}.cta`)}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.testimonials.title')}
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              {t('landing.testimonials.description')}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="rounded-lg border shadow-sm">
                <CardContent className="p-6">
                  <p className="text-muted-foreground leading-relaxed">&quot;{t(`landing.testimonials.items.${i}.quote`)}&quot;</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary font-bold">
                      {t(`landing.testimonials.items.${i}.author`).split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-semibold">{t(`landing.testimonials.items.${i}.author`)}</p>
                      <span className="text-sm text-muted-foreground font-mono mb-1">of 100MB</span>
                      <p className="text-sm text-muted-foreground">{t(`landing.testimonials.items.${i}.role`)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-foreground py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-background sm:text-4xl">
            {t('landing.cta.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-background/70">
            {t('landing.cta.description')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm font-semibold px-8">
              <Link href="/onboarding">
                {t('landing.cta.button')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-accent">
                <Wallet className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="font-bold">Finflow</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground hover:underline underline-offset-4">{t('landing.footer.privacy')}</Link>
              <Link href="#" className="hover:text-foreground hover:underline underline-offset-4">{t('landing.footer.terms')}</Link>
              <Link href="#" className="hover:text-foreground hover:underline underline-offset-4">{t('landing.footer.contact')}</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('landing.footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Dashboard Preview Component
function DashboardPreview() {
  return (
    <div className="bg-muted p-3 sm:p-6">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Balance</span>
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-2 font-mono text-xl sm:text-2xl font-bold">$24,580.00</div>
          <div className="mt-1 text-xs text-accent font-medium">+12.5% this month</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Income</span>
            <ArrowRight className="h-4 w-4 text-accent -rotate-45" />
          </div>
          <div className="mt-2 font-mono text-xl sm:text-2xl font-bold">$8,450.00</div>
          <div className="mt-1 text-xs text-muted-foreground">This month</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expenses</span>
            <ArrowRight className="h-4 w-4 text-destructive rotate-45" />
          </div>
          <div className="mt-2 font-mono text-xl sm:text-2xl font-bold">$3,240.00</div>
          <div className="mt-1 text-xs text-muted-foreground">This month</div>
        </div>
      </div>
      <div className="mt-3 sm:mt-4 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <h4 className="text-sm font-bold mb-3">Recent Transactions</h4>
          <div className="space-y-2 min-w-0">
            {[
              { name: "Client Payment", amount: "+$2,500", type: "income" },
              { name: "Software Sub", amount: "-$49.99", type: "expense" },
              { name: "Office Supplies", amount: "-$124.50", type: "expense" },
            ].map((tx, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <span className="text-sm">{tx.name}</span>
                <span className={`font-mono text-sm font-semibold ${tx.type === "income" ? "text-accent" : ""}`}>
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-bold mb-3">Budget Overview</h4>
          <div className="space-y-3">
            {[
              { name: "Marketing", percent: 60, color: "bg-chart-3" },
              { name: "Software", percent: 90, color: "bg-chart-4" },
              { name: "Office", percent: 40, color: "bg-accent" },
            ].map((budget, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{budget.name}</span>
                  <span className="font-mono">{budget.percent}%</span>
                </div>
                <div className="h-2 w-full bg-muted border border-border">
                  <div className={`h-full ${budget.color}`} style={{ width: `${budget.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Book Preview Component
function BookPreview() {
  return (
    <div className="bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted p-3">
        <div className="flex h-6 w-6 items-center justify-center bg-accent text-xs font-bold text-accent-foreground">$</div>
        <span className="text-sm font-bold">Income Tracker</span>
        <span className="ml-auto text-xs text-muted-foreground">3 entries</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-semibold">Date</th>
              <th className="px-4 py-2 text-left font-semibold">Description</th>
              <th className="px-4 py-2 text-left font-semibold">Amount</th>
              <th className="px-4 py-2 text-left font-semibold">Invoice</th>
              <th className="px-4 py-2 text-left font-semibold">Receipt</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-4 py-2 font-mono text-xs">Apr 10</td>
              <td className="px-4 py-2">Acme Corp Payment</td>
              <td className="px-4 py-2 font-mono text-accent font-semibold">$4,000.00</td>
              <td className="px-4 py-2"><span className="border border-accent bg-accent/10 px-2 py-0.5 text-xs">INV-001</span></td>
              <td className="px-4 py-2"><CheckCircle2 className="h-4 w-4 text-accent" /></td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-2 font-mono text-xs">Apr 05</td>
              <td className="px-4 py-2">Freelance Work</td>
              <td className="px-4 py-2 font-mono text-accent font-semibold">$850.00</td>
              <td className="px-4 py-2"><span className="text-muted-foreground">-</span></td>
              <td className="px-4 py-2"><CheckCircle2 className="h-4 w-4 text-accent" /></td>
            </tr>
            <tr className="border-b border-border bg-muted/30">
              <td className="px-4 py-2 font-mono text-xs">Apr 01</td>
              <td className="px-4 py-2">Consulting Fee</td>
              <td className="px-4 py-2 font-mono text-accent font-semibold">$1,500.00</td>
              <td className="px-4 py-2"><span className="border border-accent bg-accent/10 px-2 py-0.5 text-xs">INV-002</span></td>
              <td className="px-4 py-2"><span className="text-muted-foreground">Pending</span></td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-secondary border-t border-border">
              <td className="px-4 py-2 font-bold" colSpan={2}>Total</td>
              <td className="px-4 py-2 font-mono font-bold text-accent">$6,350.00</td>
              <td className="px-4 py-2" colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
