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
        "relative overflow-hidden rounded-[var(--radius)] border-2 border-border bg-card text-card-foreground shadow-[0_2px_0_0_var(--border)]",
        hoverable && "transition-[transform,box-shadow] duration-200",
        className,
      )}
    >
      {children}
    </div>
  )
}
