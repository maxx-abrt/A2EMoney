import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertWorkspaceMember, logActivity } from "./lib/auth";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    await assertWorkspaceMember(ctx, args.workspaceId);
    const budgets = await ctx.db
      .query("a2e_budgets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    // Compute fresh `spent` per budget by summing matching expenses in window
    const expenses = await ctx.db
      .query("a2e_expenses")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    return budgets.map((b) => {
      const inWindow = expenses.filter((e) => {
        if (e.type !== "expense") return false;
        if (e.category !== b.category) return false;
        if (e.date < b.startDate) return false;
        if (b.endDate && e.date > b.endDate) return false;
        return true;
      });
      const spent = inWindow.reduce((acc, e) => acc + e.amount, 0);
      return { ...b, spent };
    });
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    amount: v.number(),
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
  },
  handler: async (ctx, args) => {
    const { userId } = await assertWorkspaceMember(
      ctx,
      args.workspaceId,
      "member",
    );
    const now = Date.now();
    const id = await ctx.db.insert("a2e_budgets", {
      ...args,
      spent: 0,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
    await logActivity(ctx, {
      workspaceId: args.workspaceId,
      actorId: userId,
      action: "budget.created",
      targetType: "budget",
      targetId: id,
      metadata: { name: args.name, amount: args.amount },
    });
    return id;
  },
});

export const update = mutation({
  args: {
    budgetId: v.id("a2e_budgets"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    period: v.optional(
      v.union(
        v.literal("monthly"),
        v.literal("yearly"),
        v.literal("custom"),
      ),
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    color: v.optional(v.string()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const b = await ctx.db.get(args.budgetId);
    if (!b) throw new Error("Budget not found");
    const { userId } = await assertWorkspaceMember(
      ctx,
      b.workspaceId,
      "member",
    );
    const { budgetId, ...rest } = args as any;
    const patch: any = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(rest))
      if (val !== undefined) patch[k] = val;
    await ctx.db.patch(args.budgetId, patch);
    return args.budgetId;
  },
});

export const remove = mutation({
  args: { budgetId: v.id("a2e_budgets") },
  handler: async (ctx, args) => {
    const b = await ctx.db.get(args.budgetId);
    if (!b) throw new Error("Budget not found");
    const { userId } = await assertWorkspaceMember(
      ctx,
      b.workspaceId,
      "member",
    );
    await ctx.db.delete(args.budgetId);
    return true;
  },
});
