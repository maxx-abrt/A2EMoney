import { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { Id } from "../_generated/dataModel";
import { DataModel } from "../_generated/dataModel";
import { internal } from "../_generated/api";

export type QCtx = GenericQueryCtx<DataModel>;
export type MCtx = GenericMutationCtx<DataModel>;

export type Role = "owner" | "admin" | "member" | "viewer";
const ROLE_RANK: Record<Role, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

/**
 * Resolve the Convex `users._id` for the currently authenticated WorkOS user.
 *
 * Auth is provided by WorkOS AuthKit. The verified JWT's `sub` claim
 * (identity.subject) is the WorkOS user id. We map it to a Convex user via the
 * `authIdentities` table, which is populated by `users.store` on first login.
 */
export async function requireUserId(ctx: QCtx | MCtx): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const link = await ctx.db
    .query("authIdentities")
    .withIndex("by_workos", (q) => q.eq("workosId", identity.subject))
    .unique();
  if (!link) {
    throw new Error("User not provisioned yet. Please retry in a moment.");
  }
  return link.userId;
}

export async function getOptionalUserId(
  ctx: QCtx | MCtx,
): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const link = await ctx.db
    .query("authIdentities")
    .withIndex("by_workos", (q) => q.eq("workosId", identity.subject))
    .unique();
  return link ? link.userId : null;
}

/**
 * Workspace access check.
 *
 * Workspaces are owned by A2E Core (shared across the suite); this deployment
 * keeps a server-verified mirror in `coreMemberships` (populated by the
 * `sync.syncFromCore` action via the core service bridge — never from
 * client-supplied data). `workspaceId` is the CORE workspace id (a string).
 */
export async function assertWorkspaceMember(
  ctx: QCtx | MCtx,
  workspaceId: string,
  minRole: Role = "viewer",
): Promise<{ userId: Id<"users">; role: Role }> {
  const userId = await requireUserId(ctx);
  const membership = await ctx.db
    .query("coreMemberships")
    .withIndex("by_user_workspace", (q) =>
      q.eq("userId", userId).eq("workspaceId", workspaceId),
    )
    .unique();
  if (!membership) {
    throw new Error("Forbidden: you are not a member of this workspace");
  }
  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new Error(`Forbidden: requires ${minRole} or higher`);
  }
  return { userId, role: membership.role };
}

export async function assertWorkspaceAdmin(
  ctx: QCtx | MCtx,
  workspaceId: string,
) {
  return assertWorkspaceMember(ctx, workspaceId, "admin");
}

export async function logActivity(
  ctx: MCtx,
  args: {
    workspaceId: string;
    actorId: Id<"users">;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: any;
  },
) {
  await ctx.db.insert("activities", {
    workspaceId: args.workspaceId,
    actorId: args.actorId,
    action: args.action,
    targetType: args.targetType,
    targetId: args.targetId,
    metadata: args.metadata,
    createdAt: Date.now(),
  });
}

/**
 * Fan out a notification to every workspace member — via A2E Core, so the
 * suite-wide bell (shared across apps) shows it. Fire-and-forget: the actual
 * send happens in the `sync.sendCoreNotification` internal action, which
 * calls the core service bridge with the shared secret.
 */
export async function notifyWorkspaceMembers(
  ctx: MCtx,
  args: {
    workspaceId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
    exceptUserId?: Id<"users">;
  },
) {
  await ctx.scheduler.runAfter(0, internal.sync.sendCoreNotification, {
    workspaceId: args.workspaceId,
    type: args.type,
    title: args.title,
    message: args.message,
    link: args.link,
  });
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "workspace"}-${suffix}`;
}
