import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"

// GET /api/invoices - Get all invoices for the user
export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: TEMP_USER_ID },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Generate invoice number
    const count = await prisma.invoice.count({ where: { userId: TEMP_USER_ID } })
    const number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`
    
    const invoice = await prisma.invoice.create({
      data: {
        ...body,
        number,
        userId: TEMP_USER_ID,
        linkedDocuments: body.linkedDocuments || [],
        linkedBookEntries: body.linkedBookEntries || [],
      },
    })
    
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    )
  }
}

// PUT /api/invoices - Update an invoice
export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json()
    
    const invoice = await prisma.invoice.update({
      where: { id, userId: TEMP_USER_ID },
      data,
    })
    
    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices?id=xxx - Delete an invoice
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      )
    }
    
    await prisma.invoice.delete({
      where: { id, userId: TEMP_USER_ID },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    )
  }
}
