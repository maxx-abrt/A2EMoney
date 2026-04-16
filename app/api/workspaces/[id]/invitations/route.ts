import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"
const INVITATION_TTL_DAYS = 14

async function ensureCanManage(workspaceId: string) {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { memberships: { where: { userId: TEMP_USER_ID } } },
  })
  if (!ws) return { ok: false as const, status: 404, message: "Workspace not found" }
  const isOwner = ws.ownerId === TEMP_USER_ID
  const isAdmin = ws.memberships[0]?.role === "admin"
  if (!isOwner && !isAdmin) return { ok: false as const, status: 403, message: "Forbidden" }
  return { ok: true as const, workspace: ws }
}

// GET /api/workspaces/[id]/invitations - list pending invitations
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const check = await ensureCanManage(id)
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })

    const invitations = await prisma.invitation.findMany({
      where: { workspaceId: id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(invitations)
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}

// POST /api/workspaces/[id]/invitations - create an invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const check = await ensureCanManage(id)
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })

    const body = await request.json()
    const { email, role = "member" } = body
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }
    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const token = randomBytes(24).toString("hex")
    const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 86400000)

    const invitation = await prisma.invitation.create({
      data: {
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
        workspaceId: id,
        invitedById: TEMP_USER_ID,
      },
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    console.error("Error creating invitation:", error)
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id]/invitations?invitationId=xxx - revoke
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const check = await ensureCanManage(id)
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })

    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get("invitationId")
    if (!invitationId) {
      return NextResponse.json({ error: "invitationId required" }, { status: 400 })
    }

    await prisma.invitation.update({
      where: { id: invitationId, workspaceId: id },
      data: { status: "revoked" },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revoking invitation:", error)
    return NextResponse.json({ error: "Failed to revoke invitation" }, { status: 500 })
  }
}
