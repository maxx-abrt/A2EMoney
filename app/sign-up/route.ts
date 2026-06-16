import { redirect } from "next/navigation"
import { getSignUpUrl } from "@workos-inc/authkit-nextjs"

export async function GET(request: Request) {
  const returnPathname =
    new URL(request.url).searchParams.get("returnPathname") ?? undefined
  const url = await getSignUpUrl(
    returnPathname ? ({ returnPathname } as any) : undefined,
  )
  return redirect(url)
}
