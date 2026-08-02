import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

/**
 * BILAN (A2EMoney) — app-owned schema.
 *
 * A2E SUITE CONTRACT (see A2E_APP_INTEGRATION_GUIDE.md — binding):
 *  - Shared entities live in the A2E **core** deployment and are NEVER redefined
 *    here: users, workspaces, memberships, invitations, roles, notifications,
 *    tasks, contacts, drive files/folders, events, comments, links, intents.
 *  - Bilan references core entities by **string id**:
 *      `workspaceId`  → core `workspaces._id`
 *      `createdBy`    → the WorkOS user id (`sub`), server-derived, never client-sent
 *      `linkedClientId` → core `contacts._id`
 *      attachments    → core `drive_files` (linked back via `linkedTo`, not stored here)
 *  - Bilan's own tables are prefixed `a2e_` (plus the domain table `projects`).
 *  - `coreMemberships` is a **mirror** of core memberships (Pattern A) used only
 *    to enforce access on Bilan's own rows; core stays the source of truth.
 */

const roleValidator = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
  v.literal("viewer"),
)

export default defineSchema({
  // ---------------------------------------------------------------- suite glue

  /**
   * Mirror of the caller's core workspace memberships, refreshed by
   * `coreSync.syncFromCore` through the secret-gated core service bridge.
   * Never written from the client.
   */
  coreMemberships: defineTable({
    workosId: v.string(),
    workspaceId: v.string(),
    role: roleValidator,
    name: v.string(),
    slug: v.optional(v.string()),
    avatar: v.optional(v.string()),
    locale: v.optional(v.string()),
    currency: v.optional(v.string()),
    type: v.optional(v.string()),
    syncedAt: v.number(),
  })
    .index("by_workos", ["workosId"])
    .index("by_workos_workspace", ["workosId", "workspaceId"])
    .index("by_workspace", ["workspaceId"]),

  /**
   * Verified identity directory: maps a WorkOS user id to the authoritative
   * profile fetched server-side from the WorkOS Management API (WorkOS access
   * tokens carry no email/name claims). Used to display real names/emails next
   * to core member ids. One row per human, written only for the caller.
   */
  a2e_directory: defineTable({
    workosId: v.string(),
    coreUserId: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    lastSeenAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workos", ["workosId"])
    .index("by_core_user", ["coreUserId"]),

  /** Bilan-local audit trail (core logs its own). GDPR-exportable. */
  a2e_activity: defineTable({
    workspaceId: v.string(),
    actorId: v.string(),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId", "createdAt"])
    .index("by_actor", ["actorId"]),

  /** GDPR consent ledger (art. 7.1 — provable consent, per purpose & version). */
  a2e_consents: defineTable({
    workosId: v.string(),
    purpose: v.string(),
    granted: v.boolean(),
    version: v.string(),
    createdAt: v.number(),
  })
    .index("by_workos", ["workosId"])
    .index("by_workos_purpose", ["workosId", "purpose"]),

  /** GDPR erasure / portability request ledger (art. 15 & 17 traceability). */
  a2e_dataRequests: defineTable({
    workosId: v.string(),
    workspaceId: v.optional(v.string()),
    kind: v.union(v.literal("export"), v.literal("erasure")),
    scope: v.string(),
    result: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_workos", ["workosId"]),

  // ---------------------------------------------------------------- domain

  projects: defineTable({
    workspaceId: v.string(),
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
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_status", ["workspaceId", "status"]),

  a2e_invoices: defineTable({
    workspaceId: v.string(),
    projectId: v.optional(v.id("projects")),
    number: v.string(),
    client: v.string(),
    /** Core `contacts._id` (the suite People directory). */
    linkedClientId: v.optional(v.string()),
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
    /** Core `drive_files._id`s (files also carry `linkedTo` back to this row). */
    linkedDocuments: v.optional(v.array(v.string())),
    linkedBookEntries: v.optional(v.array(v.string())),
    taxRate: v.optional(v.number()),
    currency: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_status", ["workspaceId", "status"])
    .index("by_project", ["projectId"])
    .index("by_number", ["workspaceId", "number"]),

  a2e_expenses: defineTable({
    workspaceId: v.string(),
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
      v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
    ),
    tags: v.optional(v.array(v.string())),
    currency: v.optional(v.string()),
    sheetId: v.optional(v.id("a2e_bookSheets")),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_date", ["workspaceId", "date"])
    .index("by_category", ["workspaceId", "category"])
    .index("by_project", ["projectId"])
    .index("by_sheet", ["sheetId"]),

  a2e_bookSheets: defineTable({
    workspaceId: v.string(),
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    type: v.optional(v.string()),
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
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_template", ["isTemplate"]),

  a2e_bookEntries: defineTable({
    workspaceId: v.string(),
    sheetId: v.id("a2e_bookSheets"),
    cells: v.any(),
    linkedDocuments: v.optional(v.array(v.string())),
    linkedExpenses: v.optional(v.array(v.id("a2e_expenses"))),
    linkedInvoices: v.optional(v.array(v.id("a2e_invoices"))),
    linkedProjectId: v.optional(v.id("projects")),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sheet", ["sheetId"])
    .index("by_workspace", ["workspaceId"]),

  a2e_budgets: defineTable({
    workspaceId: v.string(),
    name: v.string(),
    amount: v.number(),
    spent: v.optional(v.number()),
    category: v.string(),
    period: v.union(v.literal("monthly"), v.literal("yearly"), v.literal("custom")),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    color: v.string(),
    currency: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_category", ["workspaceId", "category"]),

  a2e_categories: defineTable({
    workspaceId: v.string(),
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    type: v.union(v.literal("expense"), v.literal("income"), v.literal("both")),
    archived: v.optional(v.boolean()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  a2e_fiches: defineTable({
    workspaceId: v.string(),
    projectId: v.optional(v.id("projects")),
    template: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
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
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"]),

  /**
   * Organisation legal identity — one row per workspace. Bank details and
   * contact identifiers are encrypted at rest (AES-256-GCM, see lib/crypto.ts).
   */
  a2e_orgProfile: defineTable({
    workspaceId: v.string(),
    legalName: v.optional(v.string()),
    shortName: v.optional(v.string()),
    objet: v.optional(v.string()),
    rna: v.optional(v.string()),
    siret: v.optional(v.string()),
    address: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    city: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    representativeName: v.optional(v.string()),
    representativeRole: v.optional(v.string()),
    iban: v.optional(v.string()),
    bic: v.optional(v.string()),
    rupRecognized: v.optional(v.boolean()),
    fiscalRegime: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  a2e_grantReports: defineTable({
    workspaceId: v.string(),
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
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"]),
})
