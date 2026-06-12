import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(
    sizes.length - 1,
    Math.floor(Math.log(bytes) / Math.log(k)),
  )
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatCurrency(
  amount: number,
  currency = "EUR",
  locale?: string,
): string {
  const targetLocale =
    locale ||
    (typeof navigator !== "undefined" ? navigator.language : undefined) ||
    "en-US"
  try {
    return new Intl.NumberFormat(targetLocale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function formatDate(date: string | number, locale?: string): string {
  const targetLocale =
    locale ||
    (typeof navigator !== "undefined" ? navigator.language : undefined) ||
    "en-US"
  const d = typeof date === "number" ? new Date(date) : new Date(date)
  return d.toLocaleDateString(targetLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function toEpoch(value: string | number | Date | undefined): number | undefined {
  if (value === undefined || value === null || value === "") return undefined
  if (typeof value === "number") return value
  if (value instanceof Date) return value.getTime()
  const t = new Date(value).getTime()
  return isNaN(t) ? undefined : t
}

export function fromEpoch(value: number | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  return d.toISOString().split("T")[0]
}
