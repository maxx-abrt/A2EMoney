import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TEMP_USER_ID = "temp-user-id"
const TEMP_USER_EMAIL = "user@finflow.app"

// POST /api/init - Initialize the temporary user and seed default data
export async function POST() {
  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { id: TEMP_USER_ID },
    })

    if (!user) {
      // Create temporary user
      user = await prisma.user.create({
        data: {
          id: TEMP_USER_ID,
          email: TEMP_USER_EMAIL,
          name: "Demo User",
        },
      })

      // Seed default budgets
      await prisma.budget.createMany({
        data: [
          {
            userId: TEMP_USER_ID,
            name: "Marketing",
            amount: 2000,
            spent: 1200,
            category: "Marketing",
            period: "monthly",
            startDate: new Date(),
            color: "#3b82f6",
          },
          {
            userId: TEMP_USER_ID,
            name: "Software",
            amount: 500,
            spent: 450,
            category: "Software",
            period: "monthly",
            startDate: new Date(),
            color: "#8b5cf6",
          },
          {
            userId: TEMP_USER_ID,
            name: "Office Supplies",
            amount: 300,
            spent: 124.50,
            category: "Office",
            period: "monthly",
            startDate: new Date(),
            color: "#f59e0b",
          },
          {
            userId: TEMP_USER_ID,
            name: "Travel",
            amount: 1000,
            spent: 0,
            category: "Travel",
            period: "monthly",
            startDate: new Date(),
            color: "#ec4899",
          },
        ],
      })

      // Seed default book sheets
      await prisma.bookSheet.create({
        data: {
          userId: TEMP_USER_ID,
          name: "Income Tracker",
          icon: "trending-up",
          color: "#22c55e",
          columns: [
            { id: "date", name: "Date", type: "date", width: 120 },
            { id: "description", name: "Description", type: "text", width: 200 },
            { id: "amount", name: "Amount", type: "currency", width: 120 },
            { id: "source", name: "Source", type: "select", width: 150, options: ["Client Payment", "Freelance", "Refund", "Other"] },
            { id: "linked_invoice", name: "Invoice", type: "link", width: 130, linkedType: "invoice" },
            { id: "status", name: "Received", type: "checkbox", width: 100 },
            { id: "document", name: "Receipt", type: "link", width: 120, linkedType: "document" },
          ],
          entries: {
            create: [
              {
                cells: { date: "2024-04-10", description: "Acme Corp Payment", amount: 4000, source: "Client Payment", linked_invoice: "", status: true, document: "" },
                linkedDocuments: [],
                linkedExpenses: [],
                linkedInvoices: [],
              },
              {
                cells: { date: "2024-04-05", description: "Freelance Work", amount: 850, source: "Freelance", linked_invoice: "", status: true, document: "" },
                linkedDocuments: [],
                linkedExpenses: [],
                linkedInvoices: [],
              },
            ],
          },
        },
      })

      await prisma.bookSheet.create({
        data: {
          userId: TEMP_USER_ID,
          name: "Expense Log",
          icon: "receipt",
          color: "#ef4444",
          columns: [
            { id: "date", name: "Date", type: "date", width: 120 },
            { id: "vendor", name: "Vendor", type: "text", width: 180 },
            { id: "category", name: "Category", type: "select", width: 140, options: ["Office", "Software", "Travel", "Meals", "Marketing", "Other"] },
            { id: "amount", name: "Amount", type: "currency", width: 120 },
            { id: "payment", name: "Payment", type: "select", width: 130, options: ["Credit Card", "Debit Card", "Bank Transfer", "Cash"] },
            { id: "receipt", name: "Receipt", type: "link", width: 120, linkedType: "document" },
            { id: "deductible", name: "Tax Deductible", type: "checkbox", width: 120 },
            { id: "notes", name: "Notes", type: "text", width: 200 },
          ],
          entries: {
            create: [
              {
                cells: { date: "2024-04-13", vendor: "Office Depot", category: "Office", amount: 124.50, payment: "Credit Card", receipt: "", deductible: true, notes: "Printer ink and paper" },
                linkedDocuments: [],
                linkedExpenses: [],
                linkedInvoices: [],
              },
              {
                cells: { date: "2024-04-08", vendor: "Adobe", category: "Software", amount: 49.99, payment: "Credit Card", receipt: "", deductible: true, notes: "Monthly subscription" },
                linkedDocuments: [],
                linkedExpenses: [],
                linkedInvoices: [],
              },
            ],
          },
        },
      })

      await prisma.bookSheet.create({
        data: {
          userId: TEMP_USER_ID,
          name: "Budget Overview",
          icon: "pie-chart",
          color: "#3b82f6",
          columns: [
            { id: "category", name: "Category", type: "text", width: 180 },
            { id: "budget", name: "Budget", type: "currency", width: 120 },
            { id: "spent", name: "Spent", type: "currency", width: 120 },
            { id: "remaining", name: "Remaining", type: "formula", width: 120, formula: "budget - spent" },
            { id: "progress", name: "% Used", type: "formula", width: 100, formula: "(spent / budget) * 100" },
            { id: "status", name: "Status", type: "select", width: 120, options: ["On Track", "Warning", "Over Budget"] },
          ],
          entries: {
            create: [
              {
                cells: { category: "Marketing", budget: 2000, spent: 1200, remaining: 800, progress: 60, status: "On Track" },
                linkedDocuments: [],
                linkedExpenses: [],
                linkedInvoices: [],
              },
              {
                cells: { category: "Software", budget: 500, spent: 450, remaining: 50, progress: 90, status: "Warning" },
                linkedDocuments: [],
                linkedExpenses: [],
                linkedInvoices: [],
              },
              {
                cells: { category: "Office", budget: 300, spent: 124.50, remaining: 175.50, progress: 41.5, status: "On Track" },
                linkedDocuments: [],
                linkedExpenses: [],
                linkedInvoices: [],
              },
            ],
          },
        },
      })

      // Seed default projects
      await prisma.project.createMany({
        data: [
          {
            userId: TEMP_USER_ID,
            name: "Website Redesign",
            client: "Acme Corporation",
            status: "completed",
            budget: 4000,
            spent: 4000,
            startDate: new Date("2024-02-01"),
            endDate: new Date("2024-03-15"),
            linkedInvoices: [],
            linkedExpenses: [],
          },
          {
            userId: TEMP_USER_ID,
            name: "Consulting Engagement",
            client: "Tech Solutions Inc",
            status: "active",
            budget: 2000,
            spent: 1500,
            startDate: new Date("2024-03-15"),
            linkedInvoices: [],
            linkedExpenses: [],
          },
          {
            userId: TEMP_USER_ID,
            name: "Brand Identity",
            client: "Design Co",
            status: "on_hold",
            budget: 1400,
            spent: 1400,
            startDate: new Date("2024-02-15"),
            linkedInvoices: [],
            linkedExpenses: [],
          },
        ],
      })

      return NextResponse.json({
        success: true,
        message: "User initialized with demo data",
        user,
      })
    }

    return NextResponse.json({
      success: true,
      message: "User already exists",
      user,
    })
  } catch (error) {
    console.error("Error initializing user:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
