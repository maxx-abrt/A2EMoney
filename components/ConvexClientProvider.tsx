"use client";

import { ReactNode, useCallback, useState } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";
import {
  AuthKitProvider,
  useAuth,
  useAccessToken,
} from "@workos-inc/authkit-nextjs/components";
import type { UserInfo, NoUserInfo } from "@workos-inc/authkit-nextjs";
import { CoreProvider, type CoreTokenFetcher } from "@a2e/core";

export function ConvexClientProvider({
  children,
  initialAuth,
}: {
  children: ReactNode;
  initialAuth?: Omit<UserInfo | NoUserInfo, "accessToken">;
}) {
  const [convex] = useState(
    () =>
      new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
        unsavedChangesWarning: false,
        // Treat the WorkOS token as expired 30s early so the refresh completes
        // before the backend rejects it, avoiding a stuck-unauthenticated state
        // after a token refresh (get-convex/convex-backend#259).
        authRefreshTokenLeewaySeconds: 30,
      }),
  );

  return (
    <AuthKitProvider initialAuth={initialAuth}>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromAuthKit}>
        {/* Mount the shared A2E core client inside the app's auth context so
            it can reuse the same WorkOS access token. */}
        <CoreAuthBridge>{children}</CoreAuthBridge>
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  );
}

function CoreAuthBridge({ children }: { children: ReactNode }) {
  const { fetchAccessToken } = useAuthFromAuthKit();
  return <CoreProvider fetchToken={fetchAccessToken as CoreTokenFetcher}>{children}</CoreProvider>;
}

function useAuthFromAuthKit() {
  const { user, loading: isLoading } = useAuth();
  const { getAccessToken, refresh } = useAccessToken();
  const isAuthenticated = !!user;

  const fetchAccessToken = useCallback(
    async ({
      forceRefreshToken,
    }: { forceRefreshToken?: boolean } = {}): Promise<string | null> => {
      if (!user) {
        return null;
      }
      try {
        if (forceRefreshToken) {
          return (await refresh()) ?? null;
        }
        return (await getAccessToken()) ?? null;
      } catch (error) {
        console.error("Failed to get WorkOS access token:", error);
        return null;
      }
    },
    [user, refresh, getAccessToken],
  );

  return {
    isLoading,
    isAuthenticated,
    fetchAccessToken,
  };
}
