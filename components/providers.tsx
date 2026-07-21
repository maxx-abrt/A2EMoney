"use client"

import "@/lib/intl-guard"
import * as React from "react"
import { useConvexAuth, useMutation } from "convex/react"
import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { api } from "@/convex/_generated/api"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { WorkspaceProvider } from "@/lib/workspace-context"
import { FilePreviewProvider } from "@/components/file-preview-provider"
import { ConvexClientProvider } from "@/components/ConvexClientProvider"
import type { UserInfo, NoUserInfo } from "@workos-inc/authkit-nextjs"

/**
 * Provisions (or refreshes) the Convex user record for the authenticated WorkOS
 * identity. Runs once per authenticated session.
 */
function StoreUser() {
  const { isAuthenticated } = useConvexAuth()
  const { user } = useAuth()
  const store = useMutation(api.users.store)
  const done = React.useRef(false)

  React.useEffect(() => {
    if (!isAuthenticated) {
      done.current = false
      return
    }
    if (done.current) return
    done.current = true
    const name = user
      ? [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined
      : undefined
    store({
      email: user?.email ?? undefined,
      name,
      image: (user as any)?.profilePictureUrl ?? undefined,
    }).catch(() => {
      done.current = false
    })
  }, [isAuthenticated, user, store])

  return null
}

export type InitialAuth = Omit<UserInfo | NoUserInfo, "accessToken">

export function Providers({
  children,
  initialAuth,
}: {
  children: React.ReactNode
  initialAuth?: InitialAuth
}) {
  return (
    <ConvexClientProvider initialAuth={initialAuth}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <StoreUser />
        <WorkspaceProvider>
          <FilePreviewProvider>{children}</FilePreviewProvider>
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton />
        </WorkspaceProvider>
      </ThemeProvider>
    </ConvexClientProvider>
  )
}
