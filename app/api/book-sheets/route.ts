import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"

// GET /api/book-sheets - Get all book sheets for the user with entries
export async function GET() {
  try {
    const sheets = await prisma.bookSheet.findMany({
      where: { userId: TEMP_USER_ID },
      include: { entries: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(sheets)
  } catch (error) {
    console.error("Error fetching book sheets:", error)
    return NextResponse.json(
      { error: "Failed to fetch book sheets" },
      { status: 500 }
    )
  }
}

// POST /api/book-sheets - Create a new book sheet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const sheet = await prisma.bookSheet.create({
      data: {
        ...body,
        userId: TEMP_USER_ID,
        columns: body.columns || [],
      },
    })
    
    return NextResponse.json(sheet, { status: 201 })
  } catch (error) {
    console.error("Error creating book sheet:", error)
    return NextResponse.json(
      { error: "Failed to create book sheet" },
      { status: 500 }
    )
  }
}

// PUT /api/book-sheets - Update a book sheet
export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json()
    
    const sheet = await prisma.bookSheet.update({
      where: { id, userId: TEMP_USER_ID },
      data,
    })
    
    return NextResponse.json(sheet)
  } catch (error) {
    console.error("Error updating book sheet:", error)
    return NextResponse.json(
      { error: "Failed to update book sheet" },
      { status: 500 }
    )
  }
}

// DELETE /api/book-sheets?id=xxx - Delete a book sheet (cascades to entries)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json(
        { error: "Sheet ID is required" },
        { status: 400 }
      )
    }
    
    await prisma.bookSheet.delete({
      where: { id, userId: TEMP_USER_ID },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting book sheet:", error)
    return NextResponse.json(
      { error: "Failed to delete book sheet" },
      { status: 500 }
    )
  }
}
