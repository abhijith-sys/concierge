/** Stable permission keys used by requirePermission and seed. */
export const PERMISSIONS = {
  USERS_READ: "users.read",
  USERS_WRITE: "users.write",
  BUSINESSES_READ: "businesses.read",
  BUSINESSES_MODERATE: "businesses.moderate",
  BUSINESSES_DELETE: "businesses.delete",
  VERIFICATION_REVIEW: "verification.review",
  REVIEWS_MODERATE: "reviews.moderate",
  CATEGORIES_WRITE: "categories.write",
  CATEGORY_FIELDS_WRITE: "category_fields.write",
  ASSETS_READ_PRIVATE: "assets.read_private",
  ROLES_MANAGE: "roles.manage",
  AUDIT_READ: "audit.read",
  SETTINGS_WRITE: "settings.write",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: { key: PermissionKey; description: string }[] = [
  { key: PERMISSIONS.USERS_READ, description: "View user accounts" },
  { key: PERMISSIONS.USERS_WRITE, description: "Disable users and update account flags" },
  { key: PERMISSIONS.BUSINESSES_READ, description: "List and view businesses in admin" },
  { key: PERMISSIONS.BUSINESSES_MODERATE, description: "Edit, activate, or suspend businesses" },
  { key: PERMISSIONS.BUSINESSES_DELETE, description: "Soft or hard delete businesses" },
  { key: PERMISSIONS.VERIFICATION_REVIEW, description: "Review KYC verification submissions" },
  { key: PERMISSIONS.REVIEWS_MODERATE, description: "Hide or restore reviews" },
  { key: PERMISSIONS.CATEGORIES_WRITE, description: "Manage category tree" },
  { key: PERMISSIONS.CATEGORY_FIELDS_WRITE, description: "Define per-category listing fields" },
  { key: PERMISSIONS.ASSETS_READ_PRIVATE, description: "View private assets (KYC docs)" },
  { key: PERMISSIONS.ROLES_MANAGE, description: "Assign RBAC roles to users" },
  { key: PERMISSIONS.AUDIT_READ, description: "Read platform audit logs" },
  { key: PERMISSIONS.SETTINGS_WRITE, description: "Change platform settings" },
];

export const ROLE_KEYS = {
  SUPER_ADMIN: "super_admin",
  MODERATOR: "moderator",
  SUPPORT_AGENT: "support_agent",
  CATEGORY_MANAGER: "category_manager",
  SERVICE_PROVIDER: "service_provider",
  CONSUMER: "consumer",
} as const;

export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];

export type RolePreset = {
  key: RoleKey;
  name: string;
  description: string;
  permissions: PermissionKey[];
};

/** Role presets seeded as system RoleDefs. */
export const ROLE_PRESETS: RolePreset[] = [
  {
    key: ROLE_KEYS.SUPER_ADMIN,
    name: "Super Admin",
    description: "Full platform control",
    permissions: ALL_PERMISSIONS.map((p) => p.key),
  },
  {
    key: ROLE_KEYS.MODERATOR,
    name: "Moderator",
    description: "Content and listing moderation without role/schema control",
    permissions: [
      PERMISSIONS.BUSINESSES_READ,
      PERMISSIONS.BUSINESSES_MODERATE,
      PERMISSIONS.VERIFICATION_REVIEW,
      PERMISSIONS.REVIEWS_MODERATE,
      PERMISSIONS.ASSETS_READ_PRIVATE,
      PERMISSIONS.AUDIT_READ,
    ],
  },
  {
    key: ROLE_KEYS.SUPPORT_AGENT,
    name: "Support Agent",
    description: "Read-only ops support",
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.BUSINESSES_READ,
      PERMISSIONS.AUDIT_READ,
    ],
  },
  {
    key: ROLE_KEYS.CATEGORY_MANAGER,
    name: "Category Manager",
    description: "Category tree and field schemas only",
    permissions: [PERMISSIONS.CATEGORIES_WRITE, PERMISSIONS.CATEGORY_FIELDS_WRITE],
  },
  {
    key: ROLE_KEYS.SERVICE_PROVIDER,
    name: "Service Provider",
    description: "Business owner / provider (no platform admin APIs)",
    permissions: [],
  },
  {
    key: ROLE_KEYS.CONSUMER,
    name: "Consumer",
    description: "End user (no platform admin APIs)",
    permissions: [],
  },
];

/** Map legacy Prisma Role enum → default RoleDef key. */
export function roleDefKeyForLegacyRole(role: "user" | "business" | "admin"): RoleKey {
  if (role === "admin") return ROLE_KEYS.SUPER_ADMIN;
  if (role === "business") return ROLE_KEYS.SERVICE_PROVIDER;
  return ROLE_KEYS.CONSUMER;
}
