"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Glass-morphism card used across the app.
 * Falls back to a clean card on browsers without backdrop-filter support.
 */
export function GlassCard({
  className,
  children,
  hoverable = true,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }) {
  return (
    <div
      {...rest}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)] backdrop-blur-xl",
        "supports-[backdrop-filter]:bg-card/70",
        hoverable && "transition-all",
        className,
      )}
    >
      {/* subtle top highlight */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      {children}
    </div>
  )
}
