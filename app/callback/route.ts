import { handleAuth } from "@workos-inc/authkit-nextjs"

// Handles the WorkOS OAuth callback at /callback (outside /api on purpose:
// /api/* is routed to a different service by the ingress).
export const GET = handleAuth({ returnPathname: "/dashboard" })
