export type UserRole = "user" | "business" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
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

export interface Business {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  verified: boolean;
  status?: "pending" | "active";
  ownerId?: string;
  listing?: Listing;
  reviews?: Review[];
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

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

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
