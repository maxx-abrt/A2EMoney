"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useUser, type ProfileType } from "@/lib/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  HeartHandshake,
  Receipt,
  Sparkles,
  Target,
  User,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"

const profileTypes: Array<{
  value: ProfileType
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    value: "individual",
    title: "Individual",
    description: "Personal budgets, expenses, and financial goals.",
    icon: User,
  },
  {
    value: "business",
    title: "Business",
    description: "Invoicing, projects, and team-ready finance tools.",
    icon: Building2,
  },
  {
    value: "association",
    title: "Association",
    description: "NGO-friendly bookkeeping, legal, and compliance.",
    icon: HeartHandshake,
  },
]

const currencies = ["EUR", "USD", "GBP", "CHF", "CAD", "AUD", "JPY"]

const individualFeatures = [
  { id: "budgeting", title: "Budgeting", description: "Category budgets & alerts", icon: Target },
  { id: "expenses", title: "Expense tracking", description: "Quick logging & receipts", icon: Receipt },
  { id: "book", title: "Book", description: "Spreadsheet-style records", icon: FileText },
  { id: "reports", title: "Reports", description: "Monthly & yearly analytics", icon: Sparkles },
]

const businessFeatures = [
  { id: "invoicing", title: "Invoicing", description: "Professional invoices & reminders", icon: FileText },
  { id: "expenses", title: "Expense tracking", description: "Receipts & categorisation", icon: Receipt },
  { id: "projects", title: "Projects", description: "Per-project budgets", icon: Target },
  { id: "book", title: "Book", description: "Linked financial records", icon: FileText },
  { id: "legal", title: "Legal", description: "Compliance & document vault", icon: Sparkles },
  { id: "reports", title: "Reports", description: "Cashflow & P&L reports", icon: Sparkles },
]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, updateProfile } = useUser()
  const tNav = useTranslations("nav")

  const urlType = searchParams.get("type") as ProfileType | null
  const [step, setStep] = useState(1)
  const [profileType, setProfileType] = useState<ProfileType>(urlType || "individual")
  const [form, setForm] = useState({
    name: "",
    email: "",
    organizationName: "",
    currency: "EUR",
  })
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  useEffect(() => {
    if (profile?.onboardingComplete) router.replace("/dashboard")
  }, [profile, router])

  const isBusiness = profileType !== "individual"
  const availableFeatures = isBusiness ? businessFeatures : individualFeatures

  // Seed defaults based on profile type
  useEffect(() => {
    setSelectedFeatures(availableFeatures.map(f => f.id))
  }, [profileType]) // eslint-disable-line react-hooks/exhaustive-deps

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(profileType)
    if (step === 2) return form.name.trim() && form.email.trim() && (!isBusiness || form.organizationName.trim())
    if (step === 3) return selectedFeatures.length > 0
    return true
  }, [step, profileType, form, selectedFeatures, isBusiness])

  const handleComplete = () => {
    updateProfile({
      name: form.name,
      email: form.email,
      organizationName: isBusiness ? form.organizationName : undefined,
      businessName: isBusiness ? form.organizationName : undefined,
      currency: form.currency,
      type: profileType,
      profileType,
      selectedFeatures,
      onboardingComplete: true,
    })
    router.push("/dashboard")
  }

  const stepLabels = ["Profile", "Details", "Features", "Review"]

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-surface-grid" aria-hidden />
      <header className="relative border-b border-border/70 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Finflow</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Skip</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        {/* Stepper */}
        <ol className="mb-10 flex items-center justify-center gap-2 text-xs">
          {stepLabels.map((label, idx) => {
            const n = idx + 1
            const active = n === step
            const completed = n < step
            return (
              <li key={label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : completed
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
                </div>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:inline",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
                {n < stepLabels.length && <span className="mx-1 h-px w-6 bg-border sm:w-10" />}
              </li>
            )
          })}
        </ol>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 sm:p-10">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
            aria-hidden
          />
          {step === 1 && (
            <div key="step-1" className="relative animate-fade-up space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Who's this for?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick the profile that fits — you can change it later in settings.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {profileTypes.map(pt => {
                  const Icon = pt.icon
                  const selected = profileType === pt.value
                  return (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => setProfileType(pt.value)}
                      className={cn(
                        "flex flex-col items-start rounded-xl border p-5 text-left transition-all",
                        selected
                          ? "border-foreground bg-foreground text-background shadow-md"
                          : "border-border bg-card hover:border-foreground/30 hover:shadow-sm",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          selected ? "bg-background/10" : "bg-accent/10 text-accent",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold">{pt.title}</h3>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          selected ? "text-background/70" : "text-muted-foreground",
                        )}
                      >
                        {pt.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div key="step-2" className="relative animate-fade-up space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">A few details</h1>
                <p className="mt-1 text-sm text-muted-foreground">We'll personalise your workspace with this info.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="jane@company.com"
                  />
                </div>
                {isBusiness && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="organization">
                      {profileType === "association" ? "Association name" : "Organisation name"}
                    </Label>
                    <Input
                      id="organization"
                      value={form.organizationName}
                      onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))}
                      placeholder="Acme Inc."
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(c => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div key="step-3" className="relative animate-fade-up space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Choose your tools</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enable the modules you need now. You can always switch these on later.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {availableFeatures.map(feat => {
                  const Icon = feat.icon
                  const selected = selectedFeatures.includes(feat.id)
                  return (
                    <button
                      key={feat.id}
                      type="button"
                      onClick={() =>
                        setSelectedFeatures(prev =>
                          prev.includes(feat.id) ? prev.filter(id => id !== feat.id) : [...prev, feat.id],
                        )
                      }
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                        selected
                          ? "border-foreground bg-muted/50"
                          : "border-border bg-card hover:border-foreground/30",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg",
                          selected ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{feat.title}</p>
                          <CheckCircle2
                            className={cn("h-4 w-4", selected ? "text-accent" : "text-muted-foreground/30")}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{feat.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div key="step-4" className="relative animate-fade-up space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">You're all set</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review and jump into your workspace — nothing is locked in, everything is editable later.
                </p>
              </div>
              <dl className="grid gap-3 rounded-xl border border-border bg-muted/30 p-5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Profile</dt>
                  <dd className="font-medium capitalize">{profileType}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{form.name || "—"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{form.email || "—"}</dd>
                </div>
                {isBusiness && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Organisation</dt>
                    <dd className="font-medium">{form.organizationName || "—"}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Currency</dt>
                  <dd className="font-medium">{form.currency}</dd>
                </div>
                <div className="flex items-start justify-between">
                  <dt className="text-muted-foreground">Features</dt>
                  <dd className="flex flex-wrap justify-end gap-1">
                    {selectedFeatures.map(id => (
                      <Badge key={id} variant="secondary" className="rounded-full text-xs">
                        {id}
                      </Badge>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="relative mt-10 flex items-center justify-between border-t border-border pt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 4 ? (
              <Button
                size="sm"
                disabled={!canContinue}
                onClick={() => setStep(s => s + 1)}
                className="group rounded-full shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                Continue
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleComplete}
                className="group rounded-full shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                Go to {tNav("dashboard")}
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
