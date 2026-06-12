import Link from "next/link"
import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { Wallet2, ShieldTick, Flash, TickCircle } from "@/components/iconsax"
import { LanguageSwitcher } from "@/components/language-switcher"
import { AuthForm } from "@/components/auth-form"

export default async function AuthPage() {
  const t = await getTranslations("auth")
  const tLanding = await getTranslations("landing")

  const trust = [
    { Icon: ShieldTick, label: "RGPD" },
    { Icon: Flash, label: "Magic-link" },
    { Icon: TickCircle, label: "Multi-workspace" },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient gradient blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[8%] top-[12%] h-72 w-72 rounded-full bg-accent/25 blur-[120px]" />
        <div className="absolute right-[10%] top-[40%] h-80 w-80 rounded-full bg-fuchsia-400/15 blur-[120px]" />
        <div className="absolute left-1/2 bottom-[-10%] h-72 w-72 -translate-x-1/2 rounded-full bg-blue-400/15 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2" data-testid="auth-brand-link">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background ring-1 ring-foreground/10 transition-transform group-hover:rotate-3">
            <Wallet2 size={18} variant="Bulk" />
          </div>
          <span className="text-base font-semibold tracking-tight sm:text-lg">A2EMoney</span>
        </Link>
        <LanguageSwitcher />
      </header>

      {/* Split: left visual / right form */}
      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-12 pt-6 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-10">
        {/* Left — story panel (hidden on small) */}
        <aside className="hidden lg:block">
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-8 shadow-xl backdrop-blur-2xl">
            {/* pixel corner */}
            <span aria-hidden className="pointer-events-none absolute right-4 top-4 grid grid-cols-3 gap-[2px] opacity-70">
              {[1, 0, 0, 1, 1, 0, 0, 1, 1].map((on, i) => (
                <span key={i} className={`h-[3px] w-[3px] ${on ? "bg-accent" : "bg-foreground/15"}`} />
              ))}
            </span>

            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
              {tLanding("badge")}
            </p>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight">
              {tLanding("hero.title")}{" "}
              <span className="bg-gradient-to-br from-accent via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                {tLanding("hero.highlight")}
              </span>{" "}
              {tLanding("hero.tail")}.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              {tLanding("hero.description")}
            </p>

            {/* Sample card stack */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 backdrop-blur">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total balance</p>
                <p className="font-numeric mt-1 text-xl font-semibold">€12,480.50</p>
                <div className="mt-3 grid h-10 grid-cols-10 items-end gap-1">
                  {[40, 55, 38, 70, 50, 75, 60, 85, 68, 92].map((h, i) => (
                    <div
                      key={i}
                      className="rounded-sm bg-gradient-to-t from-accent/30 to-accent"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-foreground to-neutral-900 p-4 text-background">
                <p className="text-[10px] uppercase tracking-widest text-background/60">Net</p>
                <p className="font-numeric mt-1 text-xl font-semibold">+€2,120</p>
                <p className="mt-1 text-[10px] text-background/60">vs. last month</p>
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                  +12.4%
                </div>
              </div>
            </div>

            {/* Trust pills */}
            <div className="mt-7 flex flex-wrap gap-2">
              {trust.map(({ Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur"
                >
                  <Icon size={12} variant="Bulk" className="text-accent" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* Right — form panel */}
        <section className="mx-auto w-full max-w-md">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div
            className="relative mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-6 shadow-xl backdrop-blur-2xl sm:p-8"
            data-testid="auth-form-card"
          >
            {/* Top accent line */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
            />
            {/* pixel corner */}
            <span aria-hidden className="pointer-events-none absolute right-4 top-4 grid grid-cols-3 gap-[2px] opacity-60">
              {[1, 0, 0, 1, 1, 0, 0, 1, 1].map((on, i) => (
                <span key={i} className={`h-[3px] w-[3px] ${on ? "bg-accent" : "bg-foreground/15"}`} />
              ))}
            </span>

            <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted/40" />}>
              <AuthForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground lg:text-left">
            {t("legal")}{" "}
            <Link href="/legal/privacy" className="underline-offset-4 hover:underline hover:text-foreground">
              {t("privacy")}
            </Link>{" "}
            ·{" "}
            <Link href="/legal/terms" className="underline-offset-4 hover:underline hover:text-foreground">
              {t("terms")}
            </Link>
          </p>

          {/* Mobile trust pills (hidden on desktop where they're in the aside) */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 lg:hidden">
            {trust.map(({ Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur"
              >
                <Icon size={12} variant="Bulk" className="text-accent" />
                {label}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
