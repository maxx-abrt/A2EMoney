import Link from "next/link"
import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { Wallet } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { AuthForm } from "@/components/auth-form"

export default async function AuthPage() {
  const t = await getTranslations("auth")
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border/60 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">A2EMoney</span>
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-muted" />}>
              <AuthForm />
            </Suspense>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("legal")}{" "}
            <Link href="/legal/privacy" className="underline hover:text-foreground">
              {t("privacy")}
            </Link>{" "}&middot;{" "}
            <Link href="/legal/terms" className="underline hover:text-foreground">
              {t("terms")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
