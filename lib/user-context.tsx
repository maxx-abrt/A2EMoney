"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type ProfileType = "individual" | "business"

export interface UserProfile {
  name: string
  email: string
  organizationName?: string
  currency: string
  selectedFeatures: string[]
  profileType: ProfileType
  onboardingComplete: boolean
}

interface UserContextType {
  profile: UserProfile | null
  isLoading: boolean
  updateProfile: (updates: Partial<UserProfile>) => void
  logout: () => void
}

const defaultProfile: UserProfile = {
  name: "Demo User",
  email: "demo@finflow.app",
  currency: "USD",
  selectedFeatures: ["budgeting", "expenses", "reports"],
  profileType: "individual",
  onboardingComplete: true,
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load profile from localStorage
    const stored = localStorage.getItem("finflow_profile")
    if (stored) {
      try {
        setProfile(JSON.parse(stored))
      } catch {
        setProfile(defaultProfile)
      }
    } else {
      // Set default profile for demo
      setProfile(defaultProfile)
    }
    setIsLoading(false)
  }, [])

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const newProfile = prev ? { ...prev, ...updates } : { ...defaultProfile, ...updates }
      localStorage.setItem("finflow_profile", JSON.stringify(newProfile))
      return newProfile
    })
  }

  const logout = () => {
    localStorage.removeItem("finflow_profile")
    setProfile(null)
    window.location.href = "/"
  }

  return (
    <UserContext.Provider value={{ profile, isLoading, updateProfile, logout }}>
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

// Currency formatter helper
export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}
