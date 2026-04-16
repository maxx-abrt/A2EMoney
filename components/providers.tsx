"use client"

import * as React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from "@/lib/user-context"
import { DataStoreProvider } from "@/lib/data-store"
import { Toaster } from "@/components/ui/toaster"

/**
 * Client-side provider stack for the entire app. Must be mounted inside the
 * root server layout so hooks like `useUser()` / `useDataStore()` always have
 * a surrounding provider.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <UserProvider>
        <DataStoreProvider>
          {children}
          <Toaster />
        </DataStoreProvider>
      </UserProvider>
    </ThemeProvider>
  )
}
