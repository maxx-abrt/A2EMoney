import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"

// GET /api/book-entries?sheetId=xxx - Get entries for a specific sheet
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sheetId = searchParams.get("sheetId")
    
    if (!sheetId) {
      return NextResponse.json(
        { error: "Sheet ID is required" },
        { status: 400 }
      )
    }
    
    // Verify the sheet belongs to the user
    const sheet = await prisma.bookSheet.findFirst({
      where: { id: sheetId, userId: TEMP_USER_ID },
    })
    
    if (!sheet) {
      return NextResponse.json(
        { error: "Sheet not found" },
        { status: 404 }
      )
    }
    
    const entries = await prisma.bookEntry.findMany({
      where: { sheetId },
      orderBy: { createdAt: "desc" },
    })
    
    return NextResponse.json(entries)
  } catch (error) {
    console.error("Error fetching book entries:", error)
    return NextResponse.json(
      { error: "Failed to fetch book entries" },
      { status: 500 }
    )
  }
}

// POST /api/book-entries - Create a new book entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sheetId, ...entryData } = body
    
    // Verify the sheet belongs to the user
    const sheet = await prisma.bookSheet.findFirst({
      where: { id: sheetId, userId: TEMP_USER_ID },
    })
    
    if (!sheet) {
      return NextResponse.json(
        { error: "Sheet not found" },
        { status: 404 }
      )
    }
    
    const entry = await prisma.bookEntry.create({
      data: {
        ...entryData,
        sheetId,
        linkedDocuments: entryData.linkedDocuments || [],
        linkedExpenses: entryData.linkedExpenses || [],
        linkedInvoices: entryData.linkedInvoices || [],
      },
    })
    
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Error creating book entry:", error)
    return NextResponse.json(
      { error: "Failed to create book entry" },
      { status: 500 }
    )
  }
}

// PUT /api/book-entries - Update a book entry
export async function PUT(request: NextRequest) {
  try {
    const { id, sheetId, ...data } = await request.json()
    
    // Verify the sheet belongs to the user
    const sheet = await prisma.bookSheet.findFirst({
      where: { id: sheetId, userId: TEMP_USER_ID },
    })
    
    if (!sheet) {
      return NextResponse.json(
        { error: "Sheet not found" },
        { status: 404 }
      )
    }
    
    const entry = await prisma.bookEntry.update({
      where: { id, sheetId },
      data,
    })
    
    return NextResponse.json(entry)
  } catch (error) {
    console.error("Error updating book entry:", error)
    return NextResponse.json(
      { error: "Failed to update book entry" },
      { status: 500 }
    )
  }
}

// DELETE /api/book-entries?id=xxx&sheetId=yyy - Delete a book entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const sheetId = searchParams.get("sheetId")
    
    if (!id || !sheetId) {
      return NextResponse.json(
        { error: "Entry ID and Sheet ID are required" },
        { status: 400 }
      )
    }
    
    // Verify the sheet belongs to the user
    const sheet = await prisma.bookSheet.findFirst({
      where: { id: sheetId, userId: TEMP_USER_ID },
    })
    
    if (!sheet) {
      return NextResponse.json(
        { error: "Sheet not found" },
        { status: 404 }
      )
    }
    
    await prisma.bookEntry.delete({
      where: { id, sheetId },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting book entry:", error)
    return NextResponse.json(
      { error: "Failed to delete book entry" },
      { status: 500 }
    )
  }
}
