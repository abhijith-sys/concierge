import type { PrismaClient, Role } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import {
  ALL_PERMISSIONS,
  ROLE_PRESETS,
  roleDefKeyForLegacyRole,
  type PermissionKey,
  type RoleKey,
} from "./permissions.js";

type Db = PrismaClient;

export async function ensureRbacCatalog(db: Db = prisma) {
  for (const permission of ALL_PERMISSIONS) {
    await db.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: { key: permission.key, description: permission.description },
    });
  }

  const permissionRows = await db.permission.findMany();
  const permissionIdByKey = new Map(permissionRows.map((row) => [row.key, row.id]));

  for (const preset of ROLE_PRESETS) {
    const role = await db.roleDef.upsert({
      where: { key: preset.key },
      update: {
        name: preset.name,
        description: preset.description,
        isSystem: true,
      },
      create: {
        key: preset.key,
        name: preset.name,
        description: preset.description,
        isSystem: true,
      },
    });

    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (preset.permissions.length > 0) {
      await db.rolePermission.createMany({
        data: preset.permissions.map((key) => ({
          roleId: role.id,
          permissionId: permissionIdByKey.get(key)!,
        })),
        skipDuplicates: true,
      });
    }
  }
}

export async function assignRoleByKey(
  userId: string,
  roleKey: RoleKey,
  options?: { assignedById?: string; db?: Db },
) {
  const db = options?.db ?? prisma;
  const role = await db.roleDef.findUnique({ where: { key: roleKey } });
  if (!role) {
    throw new Error(`RoleDef not found: ${roleKey}`);
  }
  await db.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: { assignedById: options?.assignedById },
    create: {
      userId,
      roleId: role.id,
      assignedById: options?.assignedById,
    },
  });
}

export async function assignDefaultRoleForLegacy(
  userId: string,
  legacyRole: Role,
  options?: { assignedById?: string; db?: Db },
) {
  await assignRoleByKey(userId, roleDefKeyForLegacyRole(legacyRole), options);
}

export async function getPermissionKeysForUser(
  userId: string,
  legacyRole?: Role,
  db: Db = prisma,
): Promise<PermissionKey[]> {
  const rows = await db.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  const keys = new Set<string>();
  for (const membership of rows) {
    for (const link of membership.role.rolePermissions) {
      keys.add(link.permission.key);
    }
  }

  // Migration safety: legacy admin with no UserRole yet still has full access.
  if (keys.size === 0 && legacyRole === "admin") {
    for (const permission of ALL_PERMISSIONS) keys.add(permission.key);
  }

  return [...keys] as PermissionKey[];
}

export async function getRoleKeysForUser(userId: string, db: Db = prisma): Promise<RoleKey[]> {
  const rows = await db.userRole.findMany({
    where: { userId },
    include: { role: { select: { key: true } } },
  });
  return rows.map((row) => row.role.key as RoleKey);
}

export function userHasPermission(permissions: readonly string[], required: PermissionKey) {
  return permissions.includes(required);
}

export function userHasAnyPermission(permissions: readonly string[], required: PermissionKey[]) {
  return required.some((key) => permissions.includes(key));
}
