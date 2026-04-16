import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"

async function canManageWorkspace(workspaceId: string) {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      memberships: { where: { userId: TEMP_USER_ID } },
    },
  })
  if (!ws) return { ok: false as const, status: 404, message: "Workspace not found" }
  const isOwner = ws.ownerId === TEMP_USER_ID
  const isAdmin = ws.memberships[0]?.role === "admin"
  if (!isOwner && !isAdmin) {
    return { ok: false as const, status: 403, message: "Forbidden" }
  }
  return { ok: true as const, workspace: ws }
}

// PATCH /api/workspaces/[id] - update name/description
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const check = await canManageWorkspace(id)
    if (!check.ok) {
      return NextResponse.json({ error: check.message }, { status: check.status })
    }

    const body = await request.json()
    const updated = await prisma.workspace.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        description: body.description ?? undefined,
      },
    })
    return NextResponse.json({ ...updated, storageQuota: Number(updated.storageQuota) })
  } catch (error) {
    console.error("Error updating workspace:", error)
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id] - delete a workspace (owner only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const ws = await prisma.workspace.findUnique({ where: { id } })
    if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (ws.ownerId !== TEMP_USER_ID) {
      return NextResponse.json({ error: "Only the owner can delete a workspace" }, { status: 403 })
    }
    await prisma.workspace.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting workspace:", error)
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 })
  }
}
