import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"

// GET /api/budgets - Get all budgets for the user
export async function GET() {
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: TEMP_USER_ID },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(budgets)
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    )
  }
}

// POST /api/budgets - Create a new budget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const budget = await prisma.budget.create({
      data: {
        ...body,
        userId: TEMP_USER_ID,
        spent: body.spent || 0,
      },
    })
    
    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error("Error creating budget:", error)
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    )
  }
}

// PUT /api/budgets - Update a budget
export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json()
    
    const budget = await prisma.budget.update({
      where: { id, userId: TEMP_USER_ID },
      data,
    })
    
    return NextResponse.json(budget)
  } catch (error) {
    console.error("Error updating budget:", error)
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 }
    )
  }
}

// DELETE /api/budgets?id=xxx - Delete a budget
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json(
        { error: "Budget ID is required" },
        { status: 400 }
      )
    }
    
    await prisma.budget.delete({
      where: { id, userId: TEMP_USER_ID },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting budget:", error)
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 }
    )
  }
}
