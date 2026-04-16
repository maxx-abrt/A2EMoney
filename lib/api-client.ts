// API client for backend communication

const API_BASE = ""

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { headers: customHeaders, ...restOptions } = options
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(customHeaders || {}),
    },
    ...restOptions,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Invoices API
export const invoicesAPI = {
  getAll: () => fetchAPI("/api/invoices"),
  create: (data: Record<string, unknown>) =>
    fetchAPI("/api/invoices", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI("/api/invoices", { method: "PUT", body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) =>
    fetchAPI(`/api/invoices?id=${id}`, { method: "DELETE" }),
}

// Expenses API
export const expensesAPI = {
  getAll: () => fetchAPI("/api/expenses"),
  create: (data: Record<string, unknown>) =>
    fetchAPI("/api/expenses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI("/api/expenses", { method: "PUT", body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) =>
    fetchAPI(`/api/expenses?id=${id}`, { method: "DELETE" }),
}

// Documents API
export const documentsAPI = {
  getAll: () => fetchAPI("/api/documents"),
  create: (data: Record<string, unknown>) =>
    fetchAPI("/api/documents", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI("/api/documents", { method: "PUT", body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) =>
    fetchAPI(`/api/documents?id=${id}`, { method: "DELETE" }),
}

// Book Sheets API
export const bookSheetsAPI = {
  getAll: () => fetchAPI("/api/book-sheets"),
  create: (data: Record<string, unknown>) =>
    fetchAPI("/api/book-sheets", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI("/api/book-sheets", { method: "PUT", body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) =>
    fetchAPI(`/api/book-sheets?id=${id}`, { method: "DELETE" }),
}

// Book Entries API
export const bookEntriesAPI = {
  getAll: (sheetId: string) => fetchAPI(`/api/book-entries?sheetId=${sheetId}`),
  create: (data: Record<string, unknown>) =>
    fetchAPI("/api/book-entries", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, sheetId: string, data: Record<string, unknown>) =>
    fetchAPI("/api/book-entries", { method: "PUT", body: JSON.stringify({ id, sheetId, ...data }) }),
  delete: (id: string, sheetId: string) =>
    fetchAPI(`/api/book-entries?id=${id}&sheetId=${sheetId}`, { method: "DELETE" }),
}

// Budgets API
export const budgetsAPI = {
  getAll: () => fetchAPI("/api/budgets"),
  create: (data: Record<string, unknown>) =>
    fetchAPI("/api/budgets", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI("/api/budgets", { method: "PUT", body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) =>
    fetchAPI(`/api/budgets?id=${id}`, { method: "DELETE" }),
}

// Projects API
export const projectsAPI = {
  getAll: () => fetchAPI("/api/projects"),
  create: (data: Record<string, unknown>) =>
    fetchAPI("/api/projects", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI("/api/projects", { method: "PUT", body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) =>
    fetchAPI(`/api/projects?id=${id}`, { method: "DELETE" }),
}

// Init API
export const initAPI = {
  initialize: () => fetchAPI("/api/init", { method: "POST" }),
  health: () => fetchAPI("/api/health"),
}

// Notifications API
export const notificationsAPI = {
  getAll: (unreadOnly = false) =>
    fetchAPI(`/api/notifications${unreadOnly ? "?unread=1" : ""}`),
  create: (data: Record<string, unknown>) =>
    fetchAPI("/api/notifications", { method: "POST", body: JSON.stringify(data) }),
  markRead: (id: string) =>
    fetchAPI("/api/notifications", { method: "PATCH", body: JSON.stringify({ id, read: true }) }),
  markAllRead: () =>
    fetchAPI("/api/notifications", { method: "PATCH", body: JSON.stringify({ readAll: true }) }),
  delete: (id: string) =>
    fetchAPI(`/api/notifications?id=${id}`, { method: "DELETE" }),
  clearAll: () =>
    fetchAPI("/api/notifications?all=1", { method: "DELETE" }),
}

// Workspaces API
export const workspacesAPI = {
  getAll: () => fetchAPI("/api/workspaces"),
  create: (data: { name: string; description?: string }) =>
    fetchAPI("/api/workspaces", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchAPI(`/api/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchAPI(`/api/workspaces/${id}`, { method: "DELETE" }),
  updateMember: (workspaceId: string, userId: string, role: string) =>
    fetchAPI(`/api/workspaces/${workspaceId}/members`, {
      method: "PATCH",
      body: JSON.stringify({ userId, role }),
    }),
  removeMember: (workspaceId: string, userId: string) =>
    fetchAPI(`/api/workspaces/${workspaceId}/members?userId=${userId}`, {
      method: "DELETE",
    }),
  listInvitations: (workspaceId: string) =>
    fetchAPI(`/api/workspaces/${workspaceId}/invitations`),
  invite: (workspaceId: string, email: string, role: string) =>
    fetchAPI(`/api/workspaces/${workspaceId}/invitations`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),
  revokeInvitation: (workspaceId: string, invitationId: string) =>
    fetchAPI(
      `/api/workspaces/${workspaceId}/invitations?invitationId=${invitationId}`,
      { method: "DELETE" },
    ),
}

// Storage API
export const storageAPI = {
  get: () => fetchAPI("/api/storage") as Promise<{
    used: number
    total: number
    count: number
    percentage: number
    available: number
  }>,
}
