"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#EA4335"
        d="M12 5.04c1.86 0 3.52.64 4.83 1.9l3.6-3.6C18.18 1.18 15.31 0 12 0 7.31 0 3.27 2.69 1.28 6.62l4.19 3.25C6.46 6.95 8.99 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.51h6.47c-.28 1.4-1.1 2.59-2.36 3.39l3.63 2.82c2.12-1.96 3.35-4.85 3.35-8.45z"
      />
      <path
        fill="#FBBC05"
        d="M5.47 14.13a7.2 7.2 0 0 1-.39-2.13c0-.74.14-1.45.39-2.13L1.28 6.62A11.97 11.97 0 0 0 0 12c0 1.93.46 3.76 1.28 5.38l4.19-3.25z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.63-2.82c-1.01.68-2.3 1.07-4.3 1.07-3.01 0-5.54-1.91-6.53-4.84l-4.19 3.25C3.27 21.31 7.31 24 12 24z"
      />
    </svg>
  )
}

export function AuthForm() {
  const { signIn } = useAuthActions()
  const router = useRouter()
  const t = useTranslations("auth")
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
      const fd = new FormData()
      fd.set("email", email)
      await signIn("resend", fd)
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
      const fd = new FormData()
      fd.set("email", step.email)
      fd.set("code", code)
      await signIn("resend", fd)
      toast.success(t("toasts.signedIn"))
      router.push(nextPath)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || t("errors.code"))
    } finally {
      setLoadingCode(false)
    }
  }

  if (typeof step !== "string" && step.code) {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{step.email}</span>
        </div>
        <div>
          <Label htmlFor="code">{t("verifyCodeLabel")}</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            inputMode="numeric"
            autoFocus
            required
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{t("verifyCodeHint")}</p>
        </div>
        <Button type="submit" className="w-full" disabled={loadingCode}>
          {loadingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : t("verifyCta")}
        </Button>
        <button
          type="button"
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setStep("signIn")}
        >
          {t("useDifferentEmail")}
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2"
        onClick={handleGoogle}
        disabled={loadingGoogle}
      >
        {loadingGoogle ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <GoogleIcon className="h-4 w-4" />
            <span>{t("continueWithGoogle")}</span>
          </>
        )}
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">{t("or")}</span>
        </div>
      </div>
      <form onSubmit={handleEmail} className="space-y-3">
        <div>
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loadingEmail || !email}>
          {loadingEmail ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("sendMagicLink")
          )}
        </Button>
      </form>
    </div>
  )
}
