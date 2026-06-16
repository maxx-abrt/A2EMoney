import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * A2E SUITE SHARED SCHEMA + A2EMoney APP TABLES
 *
 * - Auth tables come from convex-auth (do not redefine).
 * - Shared tables (workspaces, memberships, invitations, projects, tasks, activities)
 *   are owned by the A2E foundation. Defined here because A2EMoney is the
 *   foundation app for the suite.
 * - App tables are prefixed `a2e_` for A2EMoney.
 */
export default defineSchema({
  // ---- auth tables (users table reused; auth itself handled by WorkOS) ----
  ...authTables,

  // Maps a verified WorkOS user (JWT `sub`) to a Convex `users` record.
  // Populated by `users.store` on first login.
  authIdentities: defineTable({
    workosId: v.string(),
    userId: v.id("users"),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    createdAt: v.number(),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_workos", ["workosId"])
    .index("by_user", ["userId"]),

  // ---- SHARED TABLES (used by every app in the suite) ----
  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    avatar: v.optional(v.string()),
    storageQuota: v.number(),
    ownerId: v.id("users"),
    // Default locale & currency for the workspace
    locale: v.optional(v.string()),
    currency: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("individual"),
        v.literal("business"),
        v.literal("association"),
      ),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  memberships: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
      v.literal("viewer"),
    ),
    joinedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_user_workspace", ["userId", "workspaceId"]),

  invitations: defineTable({
    email: v.string(),
    workspaceId: v.id("workspaces"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
      v.literal("viewer"),
    ),
    token: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("revoked"),
      v.literal("expired"),
    ),
    invitedBy: v.id("users"),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  projects: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    client: v.string(),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("on_hold"),
    ),
    budget: v.optional(v.number()),
    spent: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_status", ["workspaceId", "status"]),

  tasks: defineTable({
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done"),
    ),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"])
    .index("by_assignee", ["assigneeId"]),

  activities: defineTable({
    workspaceId: v.id("workspaces"),
    actorId: v.id("users"),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId", "createdAt"])
    .index("by_actor", ["actorId"])
    .index("by_target", ["targetType", "targetId"]),

  // User-scoped notifications. Activities are the audit trail; notifications
  // are personal, dismissable, and used to drive the bell dropdown.
  notifications: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    link: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "read"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_workspace", ["workspaceId"]),

  // ---- A2EMoney APP TABLES (prefix: a2e_) ----
  a2e_invoices: defineTable({
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    number: v.string(),
    client: v.string(),
    clientEmail: v.string(),
    clientAddress: v.optional(v.string()),
    items: v.array(
      v.object({
        id: v.string(),
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
      }),
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled"),
    ),
    issueDate: v.number(),
    dueDate: v.number(),
    paidDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    linkedDocuments: v.optional(v.array(v.string())),
    linkedBookEntries: v.optional(v.array(v.string())),
    taxRate: v.optional(v.number()),
    currency: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_status", ["workspaceId", "status"])
    .index("by_project", ["projectId"])
    .index("by_number", ["workspaceId", "number"]),

  a2e_expenses: defineTable({
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.number(),
    paymentMethod: v.string(),
    type: v.union(v.literal("expense"), v.literal("income")),
    notes: v.optional(v.string()),
    linkedDocuments: v.optional(v.array(v.string())),
    linkedInvoice: v.optional(v.id("a2e_invoices")),
    linkedBookEntries: v.optional(v.array(v.string())),
    isRecurring: v.optional(v.boolean()),
    recurringFrequency: v.optional(
      v.union(
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly"),
      ),
    ),
    tags: v.optional(v.array(v.string())),
    currency: v.optional(v.string()),
    sheetId: v.optional(v.id("a2e_bookSheets")), // legacy link from older book-entry flow
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_date", ["workspaceId", "date"])
    .index("by_category", ["workspaceId", "category"])
    .index("by_project", ["projectId"]),

  a2e_documents: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.union(
      v.literal("invoice"),
      v.literal("receipt"),
      v.literal("certificate"),
      v.literal("contract"),
      v.literal("other"),
    ),
    size: v.number(),
    contentType: v.optional(v.string()),
    url: v.string(),
    s3Key: v.string(),
    linkedToType: v.optional(
      v.union(
        v.literal("expense"),
        v.literal("invoice"),
        v.literal("book_entry"),
        v.literal("project"),
      ),
    ),
    linkedToId: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_linked", ["linkedToType", "linkedToId"]),

  a2e_bookSheets: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    type: v.optional(v.string()), // legacy field (kept for backwards-compat with older sheets)
    columns: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.string(),
        width: v.optional(v.number()),
        options: v.optional(v.array(v.string())),
        formula: v.optional(v.string()),
        required: v.optional(v.boolean()),
        linkedType: v.optional(v.string()),
      }),
    ),
    isTemplate: v.optional(v.boolean()),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_template", ["isTemplate"]),

  a2e_bookEntries: defineTable({
    workspaceId: v.id("workspaces"),
    sheetId: v.id("a2e_bookSheets"),
    cells: v.any(),
    linkedDocuments: v.optional(v.array(v.string())),
    linkedExpenses: v.optional(v.array(v.id("a2e_expenses"))),
    linkedInvoices: v.optional(v.array(v.id("a2e_invoices"))),
    linkedProjectId: v.optional(v.id("projects")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sheet", ["sheetId"])
    .index("by_workspace", ["workspaceId"]),

  a2e_budgets: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    amount: v.number(),
    spent: v.optional(v.number()),
    category: v.string(),
    period: v.union(
      v.literal("monthly"),
      v.literal("yearly"),
      v.literal("custom"),
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    color: v.string(),
    currency: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_category", ["workspaceId", "category"]),

  /** Workspace-scoped categories for expenses & income. Defaults exist client-side. */
  a2e_categories: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    type: v.union(v.literal("expense"), v.literal("income"), v.literal("both")),
    archived: v.optional(v.boolean()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"]),

  /** Project sheets ("fiches projet") - rich template-based docs linked to projects. */
  a2e_fiches: defineTable({
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    template: v.string(), // "asso_fr" | "blank" | "custom"
    title: v.string(),
    subtitle: v.optional(v.string()),
    data: v.any(), // template-specific JSON payload
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("submitted"),
        v.literal("approved"),
        v.literal("archived"),
      ),
    ),
    locale: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"]),

  /** Clients / donors / partners directory. */
  a2e_clients: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    siret: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    totalInvoiced: v.optional(v.number()),
    totalPaid: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  /** CERFA 15059 grant financial reports (compte-rendu financier de subvention). */
  a2e_grantReports: defineTable({
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    title: v.string(),
    data: v.any(),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("submitted"),
        v.literal("approved"),
        v.literal("archived"),
      ),
    ),
    locale: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"]),
});
