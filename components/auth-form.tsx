"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"
import { useTranslations, useLocale } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Refresh as Loader2, Sms as Mail, ArrowLeft2 as Back, ArrowRight } from "@/components/iconsax"
import { toast } from "sonner"

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#EA4335" d="M12 5.04c1.86 0 3.52.64 4.83 1.9l3.6-3.6C18.18 1.18 15.31 0 12 0 7.31 0 3.27 2.69 1.28 6.62l4.19 3.25C6.46 6.95 8.99 5.04 12 5.04z" />
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.51h6.47c-.28 1.4-1.1 2.59-2.36 3.39l3.63 2.82c2.12-1.96 3.35-4.85 3.35-8.45z" />
      <path fill="#FBBC05" d="M5.47 14.13a7.2 7.2 0 0 1-.39-2.13c0-.74.14-1.45.39-2.13L1.28 6.62A11.97 11.97 0 0 0 0 12c0 1.93.46 3.76 1.28 5.38l4.19-3.25z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.63-2.82c-1.01.68-2.3 1.07-4.3 1.07-3.01 0-5.54-1.91-6.53-4.84l-4.19 3.25C3.27 21.31 7.31 24 12 24z" />
    </svg>
  )
}

export function AuthForm() {
  const { signIn } = useAuthActions()
  const router = useRouter()
  const t = useTranslations("auth")
  const locale = useLocale()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next") || "/dashboard"
  const [email, setEmail] = React.useState("")
  const [step, setStep] = React.useState<"signIn" | { code: true; email: string }>("signIn")
  const [code, setCode] = React.useState("")
  const [loadingGoogle, setLoadingGoogle] = React.useState(false)
  const [loadingEmail, setLoadingEmail] = React.useState(false)
  const [loadingCode, setLoadingCode] = React.useState(false)

  async function handleGoogle() {
    try {
      setLoadingGoogle(true)
      await signIn("google", { redirectTo: nextPath })
    } catch (err: any) {
      toast.error(err?.message || t("errors.google"))
      setLoadingGoogle(false)
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    try {
      setLoadingEmail(true)
      const redirectTo = nextPath.includes("?")
        ? `${nextPath}&locale=${locale}`
        : `${nextPath}?locale=${locale}`
      await signIn("resend", { email, redirectTo })
      setStep({ code: true, email })
      toast.success(t("toasts.codeSent"))
    } catch (err: any) {
      toast.error(err?.message || t("errors.email"))
    } finally {
      setLoadingEmail(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (typeof step === "string" || !code) return
    try {
      setLoadingCode(true)
      await signIn("resend", { email: step.email, code })
      toast.success(t("toasts.signedIn"))
      router.push(nextPath)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || t("errors.code"))
    } finally {
      setLoadingCode(false)
    }
  }

  const inCodeStep = typeof step !== "string" && step.code

  return (
    <AnimatePresence mode="wait" initial={false}>
      {inCodeStep ? (
        <motion.form
          key="code"
          onSubmit={handleVerify}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="space-y-5"
        >
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-sm">
            <Mail size={16} variant="Bulk" className="text-muted-foreground" />
            <span className="truncate font-medium">{(step as { code: true; email: string }).email}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code" className="text-xs font-medium uppercase tracking-wider">
              {t("verifyCodeLabel")}
            </Label>
            <Input
              id="code"
              data-testid="auth-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoFocus
              required
              className="h-11 text-center font-numeric text-lg tracking-[0.4em]"
            />
            <p className="pt-1 text-xs text-muted-foreground">{t("verifyCodeHint")}</p>
          </div>
          <Button
            data-testid="auth-verify-btn"
            type="submit"
            size="lg"
            className="h-11 w-full rounded-xl"
            disabled={loadingCode || !code}
          >
            {loadingCode ? (
              <Loader2 size={16} variant="Bulk" className="animate-spin" />
            ) : (
              <>
                {t("verifyCta")}
                <ArrowRight size={14} className="ml-2" />
              </>
            )}
          </Button>
          <button
            data-testid="auth-back-btn"
            type="button"
            className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setStep("signIn")}
          >
            <Back size={12} variant="Bulk" />
            {t("useDifferentEmail")}
          </button>
        </motion.form>
      ) : (
        <motion.div
          key="signin"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="space-y-5"
        >
          <Button
            data-testid="auth-google-btn"
            type="button"
            variant="outline"
            size="lg"
            className="group h-11 w-full justify-center gap-2 rounded-xl border-border/70 bg-background/60 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md"
            onClick={handleGoogle}
            disabled={loadingGoogle}
          >
            {loadingGoogle ? (
              <Loader2 size={16} variant="Bulk" className="animate-spin" />
            ) : (
              <>
                <GoogleIcon className="h-4 w-4" />
                <span className="font-medium">{t("continueWithGoogle")}</span>
              </>
            )}
          </Button>

          <div className="relative flex items-center">
            <span className="h-px flex-1 bg-border/70" />
            <span className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("or")}
            </span>
            <span className="h-px flex-1 bg-border/70" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider">
                {t("emailLabel")}
              </Label>
              <div className="relative">
                <Mail
                  size={14}
                  variant="Bulk"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="email"
                  data-testid="auth-email-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl pl-9"
                />
              </div>
            </div>
            <Button
              data-testid="auth-magiclink-btn"
              type="submit"
              size="lg"
              className="group h-11 w-full rounded-xl"
              disabled={loadingEmail || !email}
            >
              {loadingEmail ? (
                <Loader2 size={16} variant="Bulk" className="animate-spin" />
              ) : (
                <>
                  {t("sendMagicLink")}
                  <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
