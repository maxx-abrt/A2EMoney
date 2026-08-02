import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { assertWorkspaceMember } from "./lib/auth"

// Organisation legal profile — stored ONCE per workspace and reused to
// auto-prefill every legal document (demande de subvention, convention,
// attestation, reçu, budget, rapport d'activité...).

export const get = query({
  args: { workspaceId: v.string() },
  handler: async (ctx, args) => {
    await assertWorkspaceMember(ctx, args.workspaceId)
    const row = await ctx.db
      .query("a2e_orgProfile")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .unique()
    return row ?? null
  },
})

export const upsert = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const { userId } = await assertWorkspaceMember(ctx, args.workspaceId, "member")
    const { workspaceId, ...fields } = args
    const now = Date.now()
    const existing = await ctx.db
      .query("a2e_orgProfile")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .unique()
    const patch: any = { updatedAt: now }
    for (const [k, val] of Object.entries(fields)) if (val !== undefined) patch[k] = val
    if (existing) {
      await ctx.db.patch(existing._id, patch)
      return existing._id
    }
    return ctx.db.insert("a2e_orgProfile", {
      workspaceId,
      ...patch,
      createdBy: userId,
      createdAt: now,
    })
  },
})
