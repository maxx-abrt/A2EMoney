import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getOptionalUserId, requireUserId } from "./lib/auth";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getOptionalUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      name: (user as any).name ?? null,
      email: (user as any).email ?? null,
      image: (user as any).image ?? null,
    };
  },
});

/**
 * Provision (or refresh) the Convex user for the authenticated WorkOS identity.
 * Called by the client right after WorkOS authentication. The WorkOS user id
 * comes from the verified JWT (identity.subject); profile fields are passed
 * from the client's WorkOS user object (cosmetic only).
 */
export const store = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const workosId = identity.subject;
    const email = args.email ?? (identity.email as string | undefined) ?? undefined;
    const name =
      args.name ?? (identity.name as string | undefined) ?? undefined;
    const image = args.image ?? undefined;

    const link = await ctx.db
      .query("authIdentities")
      .withIndex("by_workos", (q) => q.eq("workosId", workosId))
      .unique();

    if (link) {
      const user: any = await ctx.db.get(link.userId);
      if (user) {
        const patch: any = {};
        if (email && user.email !== email) patch.email = email;
        if (name && user.name !== name) patch.name = name;
        if (image && user.image !== image) patch.image = image;
        if (Object.keys(patch).length > 0) await ctx.db.patch(link.userId, patch);
      }
      await ctx.db.patch(link._id, { lastSeenAt: Date.now() });
      return link.userId;
    }

    const userId = await ctx.db.insert("users", { name, email, image } as any);
    await ctx.db.insert("authIdentities", {
      workosId,
      userId,
      email,
      name,
      image,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    });
    return userId;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const patch: any = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.image !== undefined) patch.image = args.image;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(userId, patch);
    }
    return userId;
  },
});
