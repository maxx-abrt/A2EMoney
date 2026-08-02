import { action, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

/**
 * A2E Core service bridge (client side).
 *
 * Workspaces/memberships are owned by A2E Core. This module keeps a
 * server-verified mirror (`coreMemberships`) in this deployment so our own
 * functions can enforce workspace access without trusting the client, and
 * fans out workspace notifications through core so they appear in the
 * suite-wide bell.
 *
 * Requires env (both deployments): CONVEX_CORE_URL, A2E_SERVICE_SECRET.
 */

const roleValidator = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
  v.literal("viewer"),
);

const mirrorRow = v.object({
  workspaceId: v.string(),
  name: v.string(),
  slug: v.string(),
  avatar: v.optional(v.string()),
  locale: v.optional(v.string()),
  currency: v.optional(v.string()),
  type: v.optional(v.string()),
  role: roleValidator,
});

const workspacesForUserRef = makeFunctionReference<
  "query",
  { workosId: string; secret: string },
  Array<{
    workspaceId: string;
    name: string;
    slug: string;
    avatar?: string;
    locale?: string;
    currency?: string;
    type?: string;
    role: "owner" | "admin" | "member" | "viewer";
  }>
>("sync:workspacesForUser");

const notifyWorkspaceRef = makeFunctionReference<
  "mutation",
  Record<string, unknown>,
  { sent: number }
>("sync:notifyWorkspace");

function coreClient() {
  const url = process.env.CONVEX_CORE_URL;
  if (!url) throw new Error("CONVEX_CORE_URL is not set on this deployment");
  return new ConvexHttpClient(url);
}

function serviceSecret() {
  const s = process.env.A2E_SERVICE_SECRET;
  if (!s) throw new Error("A2E_SERVICE_SECRET is not set on this deployment");
  return s;
}

/**
 * Refresh the caller's core-membership mirror. Called by the client after
 * authentication and whenever core workspaces change (cheap, idempotent).
 */
export const syncFromCore = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { synced: 0 };
    const rows = await coreClient().query(workspacesForUserRef, {
      workosId: identity.subject,
      secret: serviceSecret(),
    });
    await ctx.runMutation(internal.sync.applyMirror, {
      workosId: identity.subject,
      rows,
    });
    return { synced: rows.length };
  },
});

export const applyMirror = internalMutation({
  args: { workosId: v.string(), rows: v.array(mirrorRow) },
  handler: async (ctx, { workosId, rows }) => {
    const link = await ctx.db
      .query("authIdentities")
      .withIndex("by_workos", (q) => q.eq("workosId", workosId))
      .unique();
    if (!link) return;
    const existing = await ctx.db
      .query("coreMemberships")
      .withIndex("by_user", (q) => q.eq("userId", link.userId))
      .collect();
    const keep = new Set(rows.map((r) => r.workspaceId));
    for (const e of existing) {
      if (!keep.has(e.workspaceId)) await ctx.db.delete(e._id);
    }
    for (const r of rows) {
      const cur = existing.find((e) => e.workspaceId === r.workspaceId);
      if (cur) {
        await ctx.db.patch(cur._id, {
          role: r.role,
          name: r.name,
          slug: r.slug,
          avatar: r.avatar,
          locale: r.locale,
          currency: r.currency,
          type: r.type,
          syncedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("coreMemberships", {
          userId: link.userId,
          workosId,
          workspaceId: r.workspaceId,
          role: r.role,
          name: r.name,
          slug: r.slug,
          avatar: r.avatar,
          locale: r.locale,
          currency: r.currency,
          type: r.type,
          syncedAt: Date.now(),
        });
      }
    }
  },
});

/** Fire-and-forget fan-out scheduled by `lib/auth.notifyWorkspaceMembers`. */
export const sendCoreNotification = internalAction({
  args: {
    workspaceId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.optional(v.string()),
    link: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    await coreClient().mutation(notifyWorkspaceRef, {
      secret: serviceSecret(),
      workspaceId: args.workspaceId,
      type: args.type,
      title: args.title,
      message: args.message,
      link: args.link,
      sourceApp: "bilan",
    });
  },
});
