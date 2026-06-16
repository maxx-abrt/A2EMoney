import { NextResponse } from "next/server"
import { sealData } from "iron-session"
import { WorkOS } from "@workos-inc/node"

/**
 * DEV-ONLY login bypass.
 *
 * Establishes a real WorkOS AuthKit session (same shape as the hosted-login
 * callback) without going through the cross-domain hosted-login redirect. This
 * is used for automated testing in the preview environment where the headless
 * browser struggles with the WorkOS cross-origin redirect.
 *
 * Guarded by ALLOW_DEV_LOGIN=true (set only in .env.local, never committed).
 * Remove the env var before production deploy.
 */
export async function GET(request: Request) {
  if (process.env.ALLOW_DEV_LOGIN !== "true") {
    return new NextResponse("Not found", { status: 404 })
  }

  const url = new URL(request.url)
  const email = url.searchParams.get("email") || "qa.tester@a2emoney.app"
  const password = url.searchParams.get("password") || "A2eMoney!Test2025"
  const returnPathname = url.searchParams.get("returnPathname") || "/dashboard"

  try {
    const workos = new WorkOS(process.env.WORKOS_API_KEY!)
    const { user, accessToken, refreshToken } =
      await workos.userManagement.authenticateWithPassword({
        clientId: process.env.WORKOS_CLIENT_ID!,
        email,
        password,
      })

    const encryptedSession = await sealData(
      { accessToken, refreshToken, user },
      { password: process.env.WORKOS_COOKIE_PASSWORD!, ttl: 0 },
    )

    const base = process.env.NEXT_PUBLIC_SITE_URL || url.origin
    const res = NextResponse.redirect(new URL(returnPathname, base))
    res.cookies.set("wos-session", encryptedSession, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 400,
    })
    return res
  } catch (e: any) {
    return new NextResponse("Dev login failed: " + (e?.message || "error"), {
      status: 500,
    })
  }
}
