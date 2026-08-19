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
  rejectionReason?: string | null;
  listing?: {
    city?: string;
    title?: string;
    category?: { id: string; name: string; slug: string } | null;
  };
  _count?: { services?: number; reviews?: number };
};

export type AdminListing = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  currency: string;
  isActive: boolean;
  approvalStatus: string;
  rejectionReason?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  business?: { id: string; name: string; slug: string; status: string };
};

export type CategoryCounts = {
  children?: number;
  listings?: number;
  services?: number;
  fields?: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  description?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  kind?: "supplier" | "service";
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  parent?: { id: string; name: string; slug: string } | null;
  children?: Category[];
  _count?: CategoryCounts;
};

export type CategoryField = {
  id: string;
  categoryId: string;
  key: string;
  label: string;
  fieldType: string;
  required: boolean;
  scope: string;
  isActive: boolean;
  sortOrder: number;
  section?: string | null;
  helpText?: string | null;
  placeholder?: string | null;
  defaultValue?: unknown;
  options?: unknown;
  validation?: { min?: number; max?: number; minLength?: number; maxLength?: number; pattern?: string; widget?: string } | null;
  conditionalRules?: { fieldKey?: string; equals?: unknown } | null;
  source?: "platform" | "main" | "sub";
};

export type AdminForm = {
  kind: "provider" | "listing";
  formSchemaVersion: number;
  category: { id: string; name: string; slug: string; parent?: { id: string; name: string; slug: string } | null };
  layers: {
    platform: CategoryField[];
    main: CategoryField[];
    sub: CategoryField[];
  };
  fields: CategoryField[];
};

export type AdminStats = {
  businesses: { pending: number; active: number; rejected?: number; suspended: number; deleted: number };
  listings?: { total: number; pending: number; approved: number; rejected: number; draft: number };
  users: number;
  providers?: number;
  pendingProviders?: number;
  pendingListings?: number;
  categories?: number;
  subcategories?: number;
  categoryKinds?: { supplier: number; service: number };
  kycQueue: number;
  assets: number;
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

export type UploadedFile = {
  url: string;
  key: string;
  mime: string;
  bytes: number;
  visibility: "public" | "private";
  assetId: string;
};

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function csrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)concierge_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const mutating = method !== "GET" && method !== "HEAD";
  const token = csrfToken();
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(mutating && token ? { "X-CSRF-Token": token } : {}),
      ...(init?.headers ?? {}),
    },
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
    const value = await request<{ stats: AdminStats }>("/api/admin/stats");
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
  rejectBusiness: (id: string, reason: string) =>
    request(`/api/admin/businesses/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  softDelete: (id: string) =>
    request(`/api/admin/businesses/${id}?hard=false`, { method: "DELETE" }),
  listings: (params: URLSearchParams) =>
    request<{ items: AdminListing[]; pagination: { total: number } }>(
      `/api/admin/listings?${params.toString()}`,
    ),
  approveListing: (id: string) =>
    request(`/api/admin/listings/${id}/approve`, { method: "POST", body: "{}" }),
  rejectListing: (id: string, reason: string) =>
    request(`/api/admin/listings/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  deleteListing: (id: string) =>
    request(`/api/admin/listings/${id}`, { method: "DELETE" }),
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
  createCategory: (input: Record<string, unknown>) =>
    request<{ category: Category }>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateCategory: (id: string, input: Record<string, unknown>) =>
    request<{ category: Category }>(`/api/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteCategory: (id: string, hard = false) =>
    request<{ category: Category }>(`/api/admin/categories/${id}${hard ? "?hard=true" : ""}`, {
      method: "DELETE",
    }),
  upload: async (file: File) => {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const value = await request<{ file: UploadedFile }>("/api/uploads", {
      method: "POST",
      body: JSON.stringify({
        data,
        mime: file.type || "application/octet-stream",
        fileName: file.name,
        visibility: "public",
      }),
    });
    return value.file;
  },
  categoryFields: async (categoryId: string) => {
    const value = await request<{ fields: CategoryField[] }>(
      `/api/admin/categories/${categoryId}/fields`,
    );
    return value.fields;
  },
  adminForm: (categoryId: string, kind: "provider" | "listing") =>
    request<AdminForm>(`/api/admin/forms/${categoryId}?kind=${kind}`),
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
  reorderFields: (ids: string[]) =>
    request<{ fields: CategoryField[] }>("/api/admin/category-fields/reorder", {
      method: "PUT",
      body: JSON.stringify({ ids }),
    }),
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
