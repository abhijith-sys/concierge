import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  ROLE_KEYS,
  ROLE_PRESETS,
  roleDefKeyForLegacyRole,
} from "../../src/shared/auth/permissions";
import { userHasAnyPermission, userHasPermission } from "../../src/shared/auth/rbac.service";

describe("RBAC catalog", () => {
  it("keeps permission keys unique", () => {
    const keys = ALL_PERMISSIONS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives super_admin every permission", () => {
    const superAdmin = ROLE_PRESETS.find((r) => r.key === ROLE_KEYS.SUPER_ADMIN)!;
    expect(superAdmin.permissions).toHaveLength(ALL_PERMISSIONS.length);
    expect(userHasPermission(superAdmin.permissions, PERMISSIONS.ROLES_MANAGE)).toBe(true);
  });

  it("maps legacy roles to RoleDef keys", () => {
    expect(roleDefKeyForLegacyRole("admin")).toBe(ROLE_KEYS.SUPER_ADMIN);
    expect(roleDefKeyForLegacyRole("business")).toBe(ROLE_KEYS.SERVICE_PROVIDER);
    expect(roleDefKeyForLegacyRole("user")).toBe(ROLE_KEYS.CONSUMER);
  });

  it("checks any-permission helpers", () => {
    const mods = ROLE_PRESETS.find((r) => r.key === ROLE_KEYS.MODERATOR)!.permissions;
    expect(userHasAnyPermission(mods, [PERMISSIONS.BUSINESSES_DELETE, PERMISSIONS.BUSINESSES_MODERATE])).toBe(
      true,
    );
    expect(userHasAnyPermission(mods, [PERMISSIONS.ROLES_MANAGE, PERMISSIONS.SETTINGS_WRITE])).toBe(false);
  });
});
