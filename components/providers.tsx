"use client"

import * as React from "react"
import { ConvexReactClient } from "convex/react"
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { WorkspaceProvider } from "@/lib/workspace-context"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <WorkspaceProvider>
          {children}
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton />
        </WorkspaceProvider>
      </ThemeProvider>
    </ConvexAuthNextjsProvider>
  )
}
