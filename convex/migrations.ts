import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { Id } from "./_generated/dataModel";
import { getOptionalUserId, requireUserId } from "./lib/auth";

/**
 * One-shot, self-service migration from legacy LOCAL workspaces to A2E Core
 * workspaces (shared across the suite).
 *
 * Flow (driven by the client's workspace-context):
 *  1. `myLegacy` lists the caller's pre-core workspaces + their coreId status.
 *  2. The owner creates the core workspace via @a2e/core, then calls
 *     `claim({localId, coreId})` — verifies ownership, stamps `coreId`, and
 *     repoints every app-data row to the core workspace id.
 *  3. Other members call `joinCore({localId})` — their legacy role is
 *     imported into core via the service bridge (server-verified).
 *  4. `migrateDocuments({workspaceId})` backfills legacy `a2e_documents`
 *     rows into core drive (B2 objects untouched), then deletes the rows.
 */

const importMembershipRef = makeFunctionReference<
  "mutation",
  Record<string, unknown>,
  { membershipId: string; created: boolean }
>("sync:importMembership");

const importDriveFileRef = makeFunctionReference<
  "mutation",
  Record<string, unknown>,
  { fileId: string; created: boolean }
>("sync:importDriveFile");

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

/** Tables whose rows are repointed from the legacy workspace id to the core id. */
const WORKSPACE_SCOPED_TABLES = [
  "projects",
  "tasks",
  "activities",
  "notifications",
  "a2e_invoices",
  "a2e_expenses",
  "a2e_documents",
  "a2e_bookSheets",
  "a2e_bookEntries",
  "a2e_budgets",
  "a2e_categories",
  "a2e_fiches",
  "a2e_orgProfile",
  "a2e_clients",
  "a2e_grantReports",
] as const;

export const myLegacy = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getOptionalUserId(ctx);
    if (!userId) return [];
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const out: Array<{
      localId: Id<"workspaces">;
      name: string;
      role: "owner" | "admin" | "member" | "viewer";
      coreId: string | null;
    }> = [];
    for (const m of memberships) {
      const w = await ctx.db.get(m.workspaceId);
      if (!w) continue;
      out.push({ localId: w._id, name: w.name, role: m.role, coreId: w.coreId ?? null });
    }
    return out;
  },
});

export const legacyRole = internalQuery({
  args: { localId: v.id("workspaces") },
  handler: async (ctx, { localId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const link = await ctx.db
      .query("authIdentities")
      .withIndex("by_workos", (q) => q.eq("workosId", identity.subject))
      .unique();
    if (!link) return null;
    const m = await ctx.db
      .query("memberships")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", link.userId).eq("workspaceId", localId),
      )
      .unique();
    return m?.role ?? null;
  },
});

export const legacyCoreId = internalQuery({
  args: { localId: v.id("workspaces") },
  handler: async (ctx, { localId }) => {
    const w = await ctx.db.get(localId);
    return w?.coreId ?? null;
  },
});

/**
 * Owner/admin-only: bind a legacy workspace to its freshly created core
 * workspace and repoint all app data. Idempotent.
 */
export const claim = mutation({
  args: { localId: v.id("workspaces"), coreId: v.string() },
  handler: async (ctx, { localId, coreId }) => {
    const userId = await requireUserId(ctx);
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", userId).eq("workspaceId", localId),
      )
      .unique();
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Forbidden: only the workspace owner can migrate it");
    }
    const w = await ctx.db.get(localId);
    if (!w) throw new Error("Workspace not found");
    if (w.coreId && w.coreId !== coreId) throw new Error("Already migrated to another core workspace");
    if (!w.coreId) await ctx.db.patch(localId, { coreId });

    let moved = 0;
    for (const table of WORKSPACE_SCOPED_TABLES) {
      const rows = await ctx.db
        .query(table)
        .filter((q) => q.eq(q.field("workspaceId"), localId))
        .collect();
      for (const row of rows) {
        await ctx.db.patch(row._id, { workspaceId: coreId });
        moved++;
      }
    }
    return { moved };
  },
});

/**
 * Any legacy member: import their role into the already-claimed core
 * workspace (server-verified via the service bridge), then refresh the mirror.
 */
export const joinCore = action({
  args: { localId: v.id("workspaces") },
  handler: async (
    ctx,
    { localId },
  ): Promise<{ joined: boolean; coreId?: string; reason?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const role = await ctx.runQuery(internal.migrations.legacyRole, { localId });
    if (!role) throw new Error("Forbidden: not a member of the legacy workspace");
    const coreId = await ctx.runQuery(internal.migrations.legacyCoreId, { localId });
    if (!coreId) return { joined: false, reason: "not_migrated" };
    await coreClient().mutation(importMembershipRef, {
      secret: serviceSecret(),
      workosId: identity.subject,
      workspaceId: coreId,
      role,
    });
    const rows = await coreClient().query(
      makeFunctionReference<"query", { workosId: string; secret: string }, any[]>(
        "sync:workspacesForUser",
      ),
      { workosId: identity.subject, secret: serviceSecret() },
    );
    await ctx.runMutation(internal.sync.applyMirror, {
      workosId: identity.subject,
      rows,
    });
    return { joined: true, coreId };
  },
});

export const legacyDocuments = internalQuery({
  args: { workspaceId: v.string() },
  handler: async (ctx, { workspaceId }) => {
    return await ctx.db
      .query("a2e_documents")
      .filter((q) => q.eq(q.field("workspaceId"), workspaceId))
      .collect();
  },
});

export const workosIdForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const link = await ctx.db
      .query("authIdentities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return link?.workosId ?? null;
  },
});

/**
 * Backfill legacy `a2e_documents` rows (already repointed to the core
 * workspace id by `claim`) into core drive. B2 objects are reused as-is —
 * only metadata moves. Each migrated row is deleted locally. Idempotent.
 */
export const migrateDocuments = action({
  args: { workspaceId: v.string() },
  handler: async (
    ctx,
    { workspaceId },
  ): Promise<{ migrated: number; skipped: number; remaining: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const docs = await ctx.runQuery(internal.migrations.legacyDocuments, { workspaceId });
    let migrated = 0;
    let skipped = 0;
    for (const doc of docs) {
      const ownerWorkosId = await ctx.runQuery(internal.migrations.workosIdForUser, {
        userId: doc.createdBy,
      });
      if (!ownerWorkosId) {
        skipped++;
        continue;
      }
      await coreClient().mutation(importDriveFileRef, {
        secret: serviceSecret(),
        workosId: ownerWorkosId,
        workspaceId,
        name: doc.name,
        s3Key: doc.s3Key,
        size: doc.size,
        contentType: doc.contentType,
        sourceApp: "bilan",
        linkedTo:
          doc.linkedToType && doc.linkedToId
            ? { app: "bilan", type: doc.linkedToType, id: doc.linkedToId }
            : undefined,
        createdAt: doc.createdAt,
      });
      await ctx.runMutation(internal.migrations.deleteLegacyDocument, { documentId: doc._id });
      migrated++;
    }
    return { migrated, skipped, remaining: docs.length - migrated };
  },
});

export const deleteLegacyDocument = internalMutation({
  args: { documentId: v.id("a2e_documents") },
  handler: async (ctx, { documentId }) => {
    await ctx.db.delete(documentId);
  },
});
