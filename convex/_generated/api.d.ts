/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as a2e_books from "../a2e_books.js";
import type * as a2e_budgets from "../a2e_budgets.js";
import type * as a2e_categories from "../a2e_categories.js";
import type * as a2e_clients from "../a2e_clients.js";
import type * as a2e_documents from "../a2e_documents.js";
import type * as a2e_expenses from "../a2e_expenses.js";
import type * as a2e_fiches from "../a2e_fiches.js";
import type * as a2e_grantReports from "../a2e_grantReports.js";
import type * as a2e_invoices from "../a2e_invoices.js";
import type * as a2e_org from "../a2e_org.js";
import type * as activities from "../activities.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as migrations from "../migrations.js";
import type * as projects from "../projects.js";
import type * as sync from "../sync.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  a2e_books: typeof a2e_books;
  a2e_budgets: typeof a2e_budgets;
  a2e_categories: typeof a2e_categories;
  a2e_clients: typeof a2e_clients;
  a2e_documents: typeof a2e_documents;
  a2e_expenses: typeof a2e_expenses;
  a2e_fiches: typeof a2e_fiches;
  a2e_grantReports: typeof a2e_grantReports;
  a2e_invoices: typeof a2e_invoices;
  a2e_org: typeof a2e_org;
  activities: typeof activities;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  migrations: typeof migrations;
  projects: typeof projects;
  sync: typeof sync;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
