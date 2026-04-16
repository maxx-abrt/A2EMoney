import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"

// GET /api/documents - Get all documents for the user
export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: TEMP_USER_ID },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}

// POST /api/documents - Create a new document record (after S3 upload)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const document = await prisma.document.create({
      data: {
        ...body,
        userId: TEMP_USER_ID,
      },
    })
    
    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    )
  }
}

// PUT /api/documents - Update a document (e.g., link to expense/invoice)
export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json()
    
    const document = await prisma.document.update({
      where: { id, userId: TEMP_USER_ID },
      data,
    })
    
    return NextResponse.json(document)
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    )
  }
}

// DELETE /api/documents?id=xxx - Delete a document record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      )
    }
    
    await prisma.document.delete({
      where: { id, userId: TEMP_USER_ID },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    )
  }
}
