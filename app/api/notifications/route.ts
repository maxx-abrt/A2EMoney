import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"

// GET /api/notifications - list notifications (optionally only unread)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "1"

    const notifications = await prisma.notification.findMany({
      where: {
        userId: TEMP_USER_ID,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    )
  }
}

// POST /api/notifications - create a new notification (for event triggers)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type = "info", title, message, link, metadata } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: "title and message are required" },
        { status: 400 },
      )
    }

    const notification = await prisma.notification.create({
      data: {
        userId: TEMP_USER_ID,
        type,
        title,
        message,
        link: link ?? null,
        metadata: metadata ?? undefined,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 },
    )
  }
}

// PATCH /api/notifications - mark all as read ({ readAll: true }) or single ({ id, read })
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.readAll) {
      await prisma.notification.updateMany({
        where: { userId: TEMP_USER_ID, read: false },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    if (body.id) {
      await prisma.notification.update({
        where: { id: body.id, userId: TEMP_USER_ID },
        data: { read: body.read ?? true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: "Either id or readAll must be provided" },
      { status: 400 },
    )
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    )
  }
}

// DELETE /api/notifications?id=xxx  or  /api/notifications?all=1
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const all = searchParams.get("all") === "1"

    if (all) {
      await prisma.notification.deleteMany({ where: { userId: TEMP_USER_ID } })
      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    await prisma.notification.delete({
      where: { id, userId: TEMP_USER_ID },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 },
    )
  }
}
