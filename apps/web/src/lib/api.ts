export type UserRole = "user" | "business" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  children?: Category[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  userId?: string;
  user?: Pick<User, "id" | "name">;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number | string;
  currency: string;
  durationMinutes?: number | null;
  images: string[];
  isActive: boolean;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  socialLinks?: SocialLinks | null;
  verified: boolean;
  status?: "pending" | "active" | "suspended" | "deleted";
  ownerId?: string;
  listing?: Listing;
  reviews?: Review[];
  services?: Service[];
}

export interface Listing {
  id: string;
  businessId?: string;
  title: string;
  description: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  hours?: Record<string, [string, string] | null>;
  images: string[];
  website?: string;
  avgRating: number;
  reviewCount: number;
  featured?: boolean;
  category?: Category;
  business?: Business;
}

export interface SearchResult {
  items: Listing[];
  total: number;
  page: number;
  pages: number;
}

export interface VerificationSubmission {
  id: string;
  businessId: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  ownerPhotoUrl?: string | null;
  locationPhotoUrl?: string | null;
  storefrontPhotoUrl?: string | null;
  documentUrl?: string | null;
  selfieUrl?: string | null;
  videoUrl?: string | null;
  reviewNotes?: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
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
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(mutating && token ? { "X-CSRF-Token": token } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => null)) as
    | { error?: string | { message?: string }; message?: string }
    | null;
  if (!response.ok) {
    const errorMessage =
      typeof body?.error === "string" ? body.error : body?.error?.message;
    throw new ApiError(errorMessage ?? body?.message ?? "Something went wrong.", response.status);
  }
  return body as T;
}

function unwrapArray<T>(value: unknown, keys: string[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    for (const key of keys) {
      const nested = (value as Record<string, unknown>)[key];
      if (Array.isArray(nested)) return nested as T[];
    }
  }
  return [];
}

export const api = {
  me: async () => {
    const value = await request<{ user: User }>("/api/auth/me");
    return value.user;
  },
  updateMe: async (input: { name?: string; phone?: string | null; avatarUrl?: string | null }) => {
    const value = await request<{ user: User }>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return value.user;
  },
  requestOtp: (input: { channel?: "email" | "sms"; purpose?: "register" | "login" | "change"; phone?: string }) =>
    request<{ sent: boolean }>("/api/auth/otp/request", { method: "POST", body: JSON.stringify(input) }),
  verifyOtp: async (input: { channel?: "email" | "sms"; purpose?: "register" | "login" | "change"; code: string }) => {
    const value = await request<{ user: User }>("/api/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return value.user;
  },
  login: async (input: { email: string; password: string }) => {
    const value = await request<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return value.user;
  },
  register: async (input: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role?: UserRole;
  }) => {
    const value = await request<{ user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return value.user;
  },
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  upload: async (file: File, visibility: "public" | "private" = "public") => {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const value = await request<{ file: { url: string } }>("/api/uploads", {
      method: "POST",
      body: JSON.stringify({ data, mime: file.type || "application/octet-stream", fileName: file.name, visibility }),
    });
    return value.file;
  },
  categories: async () => {
    const value = await request<unknown>("/api/categories");
    return unwrapArray<Category>(value, ["categories", "items", "data"]);
  },
  search: async (params: URLSearchParams): Promise<SearchResult> => {
    const value = await request<unknown>(`/api/search?${params.toString()}`);
    if (Array.isArray(value)) {
      return { items: value as Listing[], total: value.length, page: 1, pages: 1 };
    }
    const record = value as Record<string, unknown>;
    const rawItems = unwrapArray<Business>(value, ["items", "results", "businesses", "data"]);
    const items = rawItems.map((business) => ({
      ...(business.listing ?? {
        id: business.id,
        title: business.name,
        description: "",
        images: [],
        avgRating: 0,
        reviewCount: 0,
      }),
      business,
      businessId: business.id,
    }));
    const pagination = (record.pagination ?? {}) as Record<string, unknown>;
    return {
      items,
      total: Number(record.total ?? pagination.total ?? items.length),
      page: Number(record.page ?? pagination.page ?? 1),
      pages: Number(record.pages ?? pagination.pages ?? pagination.totalPages ?? 1),
    };
  },
  business: async (slug: string): Promise<Business> => {
    const value = await request<Business | { business: Business }>(
      `/api/businesses/${encodeURIComponent(slug)}`,
    );
    return "business" in value ? value.business : value;
  },
  myBusinesses: async () => {
    const value = await request<{ businesses: Business[] }>("/api/businesses/mine");
    return value.businesses;
  },
  updateBusiness: async (id: string, input: Record<string, unknown>) => {
    const value = await request<{ business: Business }>(`/api/businesses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return value.business;
  },
  services: async (businessId: string) => {
    const value = await request<{ services: Service[] }>(
      `/api/services/business/${encodeURIComponent(businessId)}`,
    );
    return value.services;
  },
  createService: async (input: Record<string, unknown>) => {
    const value = await request<{ service: Service }>("/api/services", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return value.service;
  },
  updateService: async (id: string, input: Record<string, unknown>) => {
    const value = await request<{ service: Service }>(`/api/services/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return value.service;
  },
  deleteService: (id: string) =>
    request<void>(`/api/services/${encodeURIComponent(id)}`, { method: "DELETE" }),
  verification: async (businessId: string) => {
    const value = await request<{ submission: VerificationSubmission | null }>(
      `/api/verification/business/${encodeURIComponent(businessId)}`,
    );
    return value.submission;
  },
  saveVerificationDraft: async (input: Record<string, unknown>) => {
    const value = await request<{ submission: VerificationSubmission }>("/api/verification/draft", {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return value.submission;
  },
  submitVerification: async (businessId: string) => {
    const value = await request<{ submission: VerificationSubmission }>(
      `/api/verification/business/${encodeURIComponent(businessId)}/submit`,
      { method: "POST", body: "{}" },
    );
    return value.submission;
  },
  adminBusinesses: async (params: URLSearchParams) => {
    const value = await request<{
      items: Business[];
      pagination: { total: number; page: number; totalPages: number };
    }>(`/api/admin/businesses?${params.toString()}`);
    return value;
  },
  adminBusiness: async (id: string) => {
    const value = await request<{ business: Business }>(`/api/admin/businesses/${encodeURIComponent(id)}`);
    return value.business;
  },
  adminUpdateBusiness: async (id: string, input: Record<string, unknown>) => {
    const value = await request<{ business: Business }>(`/api/admin/businesses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return value.business;
  },
  adminSuspend: (id: string) =>
    request<{ business: Business }>(`/api/admin/businesses/${encodeURIComponent(id)}/suspend`, {
      method: "POST",
      body: "{}",
    }),
  adminActivate: (id: string) =>
    request<{ business: Business }>(`/api/admin/businesses/${encodeURIComponent(id)}/activate`, {
      method: "POST",
      body: "{}",
    }),
  adminDelete: (id: string, hard = false) =>
    request<void>(`/api/admin/businesses/${encodeURIComponent(id)}?hard=${hard ? "true" : "false"}`, {
      method: "DELETE",
    }),
  verificationQueue: async () => {
    const value = await request<{ items: Array<VerificationSubmission & { business?: Business }> }>(
      "/api/verification/queue",
    );
    return value.items;
  },
  reviewVerification: async (id: string, input: { decision: "approved" | "rejected"; reviewNotes?: string; activateBusiness?: boolean }) => {
    const value = await request<{ submission: VerificationSubmission }>(
      `/api/verification/${encodeURIComponent(id)}/review`,
      { method: "POST", body: JSON.stringify(input) },
    );
    return value.submission;
  },
  reviews: async (businessId: string) => {
    const value = await request<unknown>(
      `/api/reviews?businessId=${encodeURIComponent(businessId)}&pageSize=50`,
    );
    return unwrapArray<Review>(value, ["reviews", "items", "data"]);
  },
  createReview: async (input: { businessId: string; rating: number; comment: string }) => {
    const value = await request<{ review: Review }>("/api/reviews", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return value.review;
  },
  deleteReview: (id: string) =>
    request<void>(`/api/reviews/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createBusiness: async (input: Record<string, unknown>) => {
    const value = await request<{ business: Business }>("/api/businesses", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return value.business;
  },
};
