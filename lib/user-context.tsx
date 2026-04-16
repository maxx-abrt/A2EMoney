"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type ProfileType = "individual" | "business" | "association"

export interface UserProfile {
  name: string
  email: string
  /** Alias used by pages. Mirrors profileType. */
  type: ProfileType
  /** @deprecated use `type` — kept for backwards compat */
  profileType: ProfileType
  organizationName?: string
  businessName?: string
  businessType?: string
  taxId?: string
  address?: string
  currency: string
  locale?: string
  selectedFeatures: string[]
  onboardingComplete: boolean
}

interface UserContextType {
  profile: UserProfile | null
  /** Alias for `profile` — kept for pages that were written against an older shape. */
  userProfile: UserProfile | null
  isLoading: boolean
  updateProfile: (updates: Partial<UserProfile>) => void
  /** Alias for `updateProfile`. */
  updateUserProfile: (updates: Partial<UserProfile>) => void
  logout: () => void
}

const defaultProfile: UserProfile = {
  name: "Demo User",
  email: "demo@finflow.app",
  type: "individual",
  profileType: "individual",
  currency: "EUR",
  selectedFeatures: ["budgeting", "expenses", "reports"],
  onboardingComplete: true,
}

function normalize(profile: Partial<UserProfile>): UserProfile {
  const merged = { ...defaultProfile, ...profile }
  const t = (profile.type ?? profile.profileType ?? merged.type) as ProfileType
  merged.type = t
  merged.profileType = t
  if (profile.organizationName && !merged.businessName) merged.businessName = profile.organizationName
  if (profile.businessName && !merged.organizationName) merged.organizationName = profile.businessName
  return merged
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("finflow_profile")
    if (stored) {
      try {
        setProfile(normalize(JSON.parse(stored)))
      } catch {
        setProfile(defaultProfile)
      }
    } else {
      setProfile(defaultProfile)
    }
    setIsLoading(false)
  }, [])

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = normalize({ ...(prev ?? defaultProfile), ...updates })
      localStorage.setItem("finflow_profile", JSON.stringify(next))
      return next
    })
  }

  const logout = () => {
    localStorage.removeItem("finflow_profile")
    setProfile(null)
    window.location.href = "/"
  }

  return (
    <UserContext.Provider
      value={{
        profile,
        userProfile: profile,
        isLoading,
        updateProfile,
        updateUserProfile: updateProfile,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

/**
 * Locale-aware currency formatter. Picks browser locale or explicit locale if provided.
 */
export function formatCurrency(amount: number, currency = "EUR", locale?: string) {
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
