import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"

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

// PATCH /api/workspaces/[id]/members - update a member's role ({ userId, role })
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: workspaceId } = await params
    const check = await ensureCanManage(workspaceId)
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })

    const body = await request.json()
    const { userId, role } = body
    if (!userId || !role) {
      return NextResponse.json({ error: "userId and role required" }, { status: 400 })
    }
    if (!["owner", "admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }
    if (userId === check.workspace.ownerId && role !== "owner") {
      return NextResponse.json(
        { error: "Cannot demote the workspace owner" },
        { status: 400 },
      )
    }

    const membership = await prisma.membership.update({
      where: { userId_workspaceId: { userId, workspaceId } },
      data: { role },
      include: { user: { select: { id: true, email: true, name: true, avatar: true } } },
    })
    return NextResponse.json(membership)
  } catch (error) {
    console.error("Error updating member:", error)
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id]/members?userId=xxx - remove a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: workspaceId } = await params
    const check = await ensureCanManage(workspaceId)
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })
    if (userId === check.workspace.ownerId) {
      return NextResponse.json(
        { error: "Cannot remove the workspace owner" },
        { status: 400 },
      )
    }

    await prisma.membership.delete({
      where: { userId_workspaceId: { userId, workspaceId } },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}
