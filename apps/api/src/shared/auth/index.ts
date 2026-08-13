import type { RequestHandler, Response } from "express";
import type { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME, JWT_TTL_SECONDS } from "../../config/constants.js";
import { getEnv } from "../../config/env.js";
import { ApiError } from "../errors/index.js";
import type { PermissionKey } from "./permissions.js";
import {
  getPermissionKeysForUser,
  userHasAnyPermission,
  userHasPermission,
} from "./rbac.service.js";

function jwtSecret() {
  return getEnv().JWT_SECRET;
}

export function setAuthCookie(res: Response, user: { id: string; role: Role }) {
  const token = jwt.sign(user, jwtSecret(), { expiresIn: JWT_TTL_SECONDS });
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().COOKIE_SECURE,
    maxAge: JWT_TTL_SECONDS * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().COOKIE_SECURE,
    path: "/",
  });
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
  if (!token) {
    next();
    return;
  }
  try {
    const payload = jwt.verify(token, jwtSecret()) as { id: string; role: Role };
    req.user = { id: payload.id, role: payload.role };
  } catch {
    // Expired or invalid cookie is treated as anonymous.
  }
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(new ApiError(401, "UNAUTHENTICATED", "Authentication required"));
    return;
  }
  next();
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, "UNAUTHENTICATED", "Authentication required"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action"));
      return;
    }
    next();
  };
}

async function ensurePermissions(req: Parameters<RequestHandler>[0]) {
  if (!req.user) return [] as PermissionKey[];
  if (req.user.permissions) return req.user.permissions;
  const permissions = await getPermissionKeysForUser(req.user.id, req.user.role);
  req.user.permissions = permissions;
  return permissions;
}

/** Require every listed permission. */
export function requirePermission(...keys: PermissionKey[]): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (!req.user) {
        next(new ApiError(401, "UNAUTHENTICATED", "Authentication required"));
        return;
      }
      const permissions = await ensurePermissions(req);
      const missing = keys.filter((key) => !userHasPermission(permissions, key));
      if (missing.length > 0) {
        next(new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action"));
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Require at least one of the listed permissions. */
export function requireAnyPermission(...keys: PermissionKey[]): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (!req.user) {
        next(new ApiError(401, "UNAUTHENTICATED", "Authentication required"));
        return;
      }
      const permissions = await ensurePermissions(req);
      if (!userHasAnyPermission(permissions, keys)) {
        next(new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action"));
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export { PERMISSIONS, ROLE_KEYS, ALL_PERMISSIONS, ROLE_PRESETS } from "./permissions.js";
export {
  ensureRbacCatalog,
  assignRoleByKey,
  assignDefaultRoleForLegacy,
  getPermissionKeysForUser,
  getRoleKeysForUser,
} from "./rbac.service.js";
