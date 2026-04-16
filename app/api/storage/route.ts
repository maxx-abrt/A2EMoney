import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"
export const STORAGE_QUOTA_BYTES = 100 * 1024 * 1024 // 100 MB

// GET /api/storage - return current storage usage + quota
export async function GET() {
  try {
    const agg = await prisma.document.aggregate({
      where: { userId: TEMP_USER_ID },
      _sum: { size: true },
      _count: { _all: true },
    })

    const used = agg._sum.size ?? 0
    const total = STORAGE_QUOTA_BYTES

    return NextResponse.json({
      used,
      total,
      count: agg._count._all,
      percentage: total > 0 ? Math.min(100, (used / total) * 100) : 0,
      available: Math.max(0, total - used),
    })
  } catch (error) {
    console.error("Error fetching storage usage:", error)
    return NextResponse.json(
      { error: "Failed to fetch storage usage" },
      { status: 500 },
    )
  }
}
