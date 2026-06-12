"use client"

import Link from "next/link"
import { Gavel, Shield, FileText, Scale, ExternalLink } from "lucide-react"

export default function LegalPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Legal & compliance</h1>
          <p className="mt-1 text-sm text-muted-foreground">GDPR, data residency and security details for A2EMoney.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/legal/privacy" className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <Shield className="h-5 w-5 text-accent" />
            <h2 className="mt-3 text-base font-semibold">Privacy policy</h2>
            <p className="mt-1 text-xs text-muted-foreground">How we collect, store and process your data.</p>
            <p className="mt-3 inline-flex items-center gap-1 text-xs text-accent">Read <ExternalLink className="h-3 w-3" /></p>
          </Link>
          <Link href="/legal/terms" className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <Scale className="h-5 w-5 text-accent" />
            <h2 className="mt-3 text-base font-semibold">Terms of service</h2>
            <p className="mt-1 text-xs text-muted-foreground">The rules you agree to when using the service.</p>
            <p className="mt-3 inline-flex items-center gap-1 text-xs text-accent">Read <ExternalLink className="h-3 w-3" /></p>
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Data residency</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Database hosted on Convex (EU - Paris region)</li>
            <li>• Documents stored on AWS S3 (Paris - eu-west-3)</li>
            <li>• Workspaces are fully isolated; cross-workspace access is denied by construction</li>
            <li>• All writes are recorded in the activity log for legal traceability</li>
            <li>• Workspace owners can export all data as JSON at any time (GDPR)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
