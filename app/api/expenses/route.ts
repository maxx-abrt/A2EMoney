import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"

// GET /api/expenses - Get all expenses for the user
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: TEMP_USER_ID },
      orderBy: { date: "desc" },
    })
    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    )
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const expense = await prisma.expense.create({
      data: {
        ...body,
        userId: TEMP_USER_ID,
        linkedDocuments: body.linkedDocuments || [],
        linkedBookEntries: body.linkedBookEntries || [],
        tags: body.tags || [],
      },
    })
    
    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    )
  }
}

// PUT /api/expenses - Update an expense
export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json()
    
    const expense = await prisma.expense.update({
      where: { id, userId: TEMP_USER_ID },
      data,
    })
    
    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    )
  }
}

// DELETE /api/expenses?id=xxx - Delete an expense
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      )
    }
    
    await prisma.expense.delete({
      where: { id, userId: TEMP_USER_ID },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    )
  }
}
