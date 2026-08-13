export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "business" | "admin";
  permissions?: string[];
  roles?: string[];
  disabledAt?: string | null;
};

export type Business = {
  id: string;
  name: string;
  slug: string;
  status: string;
  verified: boolean;
  listing?: { city?: string; title?: string };
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  isActive?: boolean;
  children?: Category[];
};

export type CategoryField = {
  id: string;
  key: string;
  label: string;
  fieldType: string;
  required: boolean;
  scope: string;
  isActive: boolean;
  sortOrder: number;
  section?: string | null;
  helpText?: string | null;
};

export type VerificationItem = {
  id: string;
  status: string;
  businessId: string;
  submittedAt?: string | null;
  business?: { name?: string; slug?: string };
};

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "business" | "admin";
  disabledAt?: string | null;
  roles: Array<{ id: string; key: string; name: string }>;
};

export type RoleDef = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
};

export type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
  actorId?: string | null;
  actor?: { id: string; name: string; email: string } | null;
};

export type AssetItem = {
  id: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
  visibility: string;
  status: string;
  url: string;
  uploadedBy?: { id: string; name: string; email: string } | null;
  attachments: Array<{ id: string; entityType: string; entityId: string; purpose: string }>;
};

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      message = body.error?.message ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function canAccessAdmin(user: AdminUser | null | undefined) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const staffRoles = new Set([
    "super_admin",
    "moderator",
    "support_agent",
    "category_manager",
  ]);
  if (user.roles?.some((role) => staffRoles.has(role))) return true;
  return (user.permissions?.length ?? 0) > 0;
}

export function hasPermission(user: AdminUser | null | undefined, key: string) {
  if (!user) return false;
  if (user.role === "admin" || user.roles?.includes("super_admin")) return true;
  return user.permissions?.includes(key) ?? false;
}

export const api = {
  me: async () => {
    const value = await request<{ user: AdminUser }>("/api/auth/me");
    return value.user;
  },
  login: async (input: { email: string; password: string }) => {
    const value = await request<{ user: AdminUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return value.user;
  },
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  stats: async () => {
    const value = await request<{
      stats: {
        businesses: { pending: number; active: number; suspended: number; deleted: number };
        users: number;
        kycQueue: number;
        assets: number;
      };
    }>("/api/admin/stats");
    return value.stats;
  },
  settings: async () => {
    const value = await request<{
      settings: {
        nodeEnv: string;
        cookieSecure: boolean;
        rateLimitEnabled: boolean;
        requireEmailVerification: boolean;
        runSeed: boolean;
        corsOrigins: string[];
        logLevel: string;
      };
    }>("/api/admin/settings");
    return value.settings;
  },
  businesses: (params: URLSearchParams) =>
    request<{ items: Business[]; pagination: { total: number } }>(
      `/api/admin/businesses?${params.toString()}`,
    ),
  activate: (id: string) =>
    request(`/api/admin/businesses/${id}/activate`, { method: "POST", body: "{}" }),
  suspend: (id: string) =>
    request(`/api/admin/businesses/${id}/suspend`, { method: "POST", body: "{}" }),
  softDelete: (id: string) =>
    request(`/api/admin/businesses/${id}?hard=false`, { method: "DELETE" }),
  verificationQueue: async () => {
    const value = await request<{ items: VerificationItem[] }>("/api/verification/queue");
    return value.items;
  },
  reviewVerification: (id: string, decision: "approved" | "rejected") =>
    request(`/api/verification/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ decision, activateBusiness: true }),
    }),
  categories: async () => {
    const value = await request<{ categories: Category[] }>("/api/admin/categories");
    return value.categories;
  },
  createCategory: (input: { name: string; slug?: string; parentId?: string | null }) =>
    request<{ category: Category }>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateCategory: (id: string, input: Record<string, unknown>) =>
    request<{ category: Category }>(`/api/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  categoryFields: async (categoryId: string) => {
    const value = await request<{ fields: CategoryField[] }>(
      `/api/admin/categories/${categoryId}/fields`,
    );
    return value.fields;
  },
  createField: (categoryId: string, input: Record<string, unknown>) =>
    request<{ field: CategoryField }>(`/api/admin/categories/${categoryId}/fields`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateField: (fieldId: string, input: Record<string, unknown>) =>
    request<{ field: CategoryField }>(`/api/admin/category-fields/${fieldId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteField: (fieldId: string) =>
    request<void>(`/api/admin/category-fields/${fieldId}`, { method: "DELETE" }),
  users: (params: URLSearchParams) =>
    request<{ items: ManagedUser[]; pagination: { total: number } }>(
      `/api/admin/users?${params.toString()}`,
    ),
  patchUser: async (id: string, input: { disabled?: boolean }) => {
    const value = await request<{ user: ManagedUser }>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return value.user;
  },
  roles: async () => {
    const value = await request<{ roles: RoleDef[] }>("/api/admin/roles");
    return value.roles;
  },
  assignRole: async (userId: string, roleKey: string) => {
    const value = await request<{ user: ManagedUser }>(`/api/admin/users/${userId}/roles`, {
      method: "POST",
      body: JSON.stringify({ roleKey }),
    });
    return value.user;
  },
  removeRole: async (userId: string, roleKey: string) => {
    const value = await request<{ user: ManagedUser }>(
      `/api/admin/users/${userId}/roles/${encodeURIComponent(roleKey)}`,
      { method: "DELETE" },
    );
    return value.user;
  },
  audit: (params: URLSearchParams) =>
    request<{ items: AuditItem[]; pagination: { total: number } }>(
      `/api/admin/audit?${params.toString()}`,
    ),
  assets: (params: URLSearchParams) =>
    request<{ items: AssetItem[]; pagination: { total: number } }>(
      `/api/admin/assets?${params.toString()}`,
    ),
};

export { ApiError };
