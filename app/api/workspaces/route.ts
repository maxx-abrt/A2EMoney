import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48)
}

// GET /api/workspaces - list workspaces the user belongs to (as owner or member)
export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: TEMP_USER_ID },
          { memberships: { some: { userId: TEMP_USER_ID } } },
        ],
      },
      include: {
        memberships: {
          include: { user: { select: { id: true, email: true, name: true, avatar: true } } },
        },
        invitations: { where: { status: "pending" } },
        _count: { select: { memberships: true, invitations: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    // Normalize BigInt for JSON
    const serialized = workspaces.map(ws => ({
      ...ws,
      storageQuota: Number(ws.storageQuota),
    }))

    return NextResponse.json(serialized)
  } catch (error) {
    console.error("Error fetching workspaces:", error)
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 },
    )
  }
}

// POST /api/workspaces - create a new workspace owned by the current user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    // Make sure the slug is unique
    const base = slugify(name) || "workspace"
    let slug = base
    let attempt = 1
    while (await prisma.workspace.findUnique({ where: { slug } })) {
      slug = `${base}-${attempt++}`
      if (attempt > 100) break
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description: description ?? null,
        ownerId: TEMP_USER_ID,
        memberships: {
          create: { userId: TEMP_USER_ID, role: "owner" },
        },
      },
      include: {
        memberships: {
          include: { user: { select: { id: true, email: true, name: true, avatar: true } } },
        },
        invitations: true,
      },
    })

    return NextResponse.json(
      { ...workspace, storageQuota: Number(workspace.storageQuota) },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating workspace:", error)
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 },
    )
  }
}
