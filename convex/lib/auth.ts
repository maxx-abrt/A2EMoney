<<<<<<< HEAD
import { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { Id } from "../_generated/dataModel";
import { DataModel } from "../_generated/dataModel";
import { internal } from "../_generated/api";
=======
import { GenericMutationCtx, GenericQueryCtx } from "convex/server"
import type { DataModel } from "../_generated/dataModel"
import { internal } from "../_generated/api"
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454

export type QCtx = GenericQueryCtx<DataModel>
export type MCtx = GenericMutationCtx<DataModel>
/** Anything that carries a verified identity (queries, mutations AND actions). */
export type AuthCtx = { auth: QCtx["auth"] }

export type Role = "owner" | "admin" | "member" | "viewer"
const ROLE_RANK: Record<Role, number> = { owner: 4, admin: 3, member: 2, viewer: 1 }

/** Thrown when the core membership mirror has no row yet — the client must run `coreSync.syncFromCore`. */
export const NOT_SYNCED = "WORKSPACE_NOT_SYNCED"

/**
 * The caller's WorkOS user id (`sub`), taken from the verified JWT.
 * This is the suite-wide identity: the same human has the same id in every A2E
 * app (WorkOS ids are environment-scoped). Bilan stores it as `createdBy`.
 */
export async function requireWorkosId(ctx: AuthCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Not authenticated")
  return identity.subject
}

export async function getWorkosId(ctx: AuthCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity()
  return identity ? identity.subject : null
}

<<<<<<< HEAD
/**
 * Workspace access check.
 *
 * Workspaces are owned by A2E Core (shared across the suite); this deployment
 * keeps a server-verified mirror in `coreMemberships` (populated by the
 * `sync.syncFromCore` action via the core service bridge — never from
 * client-supplied data). `workspaceId` is the CORE workspace id (a string).
=======
/** Back-compat alias: Bilan's "user id" is the WorkOS subject. */
export const requireUserId = requireWorkosId
export const getOptionalUserId = getWorkosId

/**
 * Authorises access to a **core** workspace for Bilan's own rows, using the
 * membership mirror (Pattern A). Core remains the source of truth; the mirror is
 * refreshed server-to-server through the secret-gated bridge.
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454
 */
export async function assertWorkspaceMember(
  ctx: QCtx | MCtx,
  workspaceId: string,
  minRole: Role = "viewer",
): Promise<{ userId: string; workosId: string; role: Role }> {
  const workosId = await requireWorkosId(ctx)
  const membership = await ctx.db
    .query("coreMemberships")
<<<<<<< HEAD
    .withIndex("by_user_workspace", (q) =>
      q.eq("userId", userId).eq("workspaceId", workspaceId),
=======
    .withIndex("by_workos_workspace", (q) =>
      q.eq("workosId", workosId).eq("workspaceId", workspaceId),
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454
    )
    .unique()
  if (!membership) throw new Error(NOT_SYNCED)
  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new Error(`Forbidden: requires ${minRole} or higher`)
  }
  return { userId: workosId, workosId, role: membership.role }
}

<<<<<<< HEAD
export async function assertWorkspaceAdmin(
  ctx: QCtx | MCtx,
  workspaceId: string,
) {
  return assertWorkspaceMember(ctx, workspaceId, "admin");
=======
export async function assertWorkspaceAdmin(ctx: QCtx | MCtx, workspaceId: string) {
  return assertWorkspaceMember(ctx, workspaceId, "admin")
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454
}

/** Bilan-local audit entry (the shared audit trail lives in core). */
export async function logActivity(
  ctx: MCtx,
  args: {
<<<<<<< HEAD
    workspaceId: string;
    actorId: Id<"users">;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: any;
=======
    workspaceId: string
    actorId: string
    action: string
    targetType: string
    targetId: string
    metadata?: any
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454
  },
) {
  await ctx.db.insert("a2e_activity", {
    workspaceId: args.workspaceId,
    actorId: args.actorId,
    action: args.action,
    targetType: args.targetType,
    targetId: args.targetId,
    metadata: args.metadata,
    createdAt: Date.now(),
  })
}

/**
<<<<<<< HEAD
 * Fan out a notification to every workspace member — via A2E Core, so the
 * suite-wide bell (shared across apps) shows it. Fire-and-forget: the actual
 * send happens in the `sync.sendCoreNotification` internal action, which
 * calls the core service bridge with the shared secret.
=======
 * Fans a notification out to the whole workspace through the CORE bell
 * (`sync:notifyWorkspace`). Mutations cannot call the bridge directly, so the
 * work is scheduled immediately after the transaction commits.
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454
 */
export async function notifyWorkspaceMembers(
  ctx: MCtx,
  args: {
<<<<<<< HEAD
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
=======
    workspaceId: string
    type: string
    title: string
    message?: string
    link?: string
    metadata?: any
    exceptUserId?: string
  },
) {
  await ctx.scheduler.runAfter(0, internal.coreSync.notifyWorkspace, {
    workspaceId: args.workspaceId,
    type: args.type.includes(".") ? args.type : `bilan.${args.type}`,
    title: args.title,
    message: args.message,
    link: args.link,
  })
>>>>>>> c7dfaa24a0c3daba911bcf8b8e6702c8cc08a454
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base || "workspace"}-${suffix}`
}
