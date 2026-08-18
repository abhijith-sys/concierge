import { createHash, randomBytes } from "node:crypto";
import type { RequestHandler, Response } from "express";
import type { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import {
  ACCESS_TTL_SECONDS,
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_TTL_SECONDS,
  RESET_TTL_SECONDS,
} from "../../config/constants.js";
import { getEnv } from "../../config/env.js";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors/index.js";
import type { PermissionKey } from "./permissions.js";
import {
  getPermissionKeysForUser,
  userHasAnyPermission,
  userHasPermission,
} from "./rbac.service.js";

type AccessPayload = { id: string; role: Role; typ: "access" };
type ResetPayload = { userId: string; email: string; method: "account" | "recovery"; typ: "password_reset" };

function jwtSecret() {
  return getEnv().JWT_SECRET;
}

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: getEnv().COOKIE_SECURE,
    path: "/",
  };
}

function hashRefreshToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function setAccessCookie(res: Response, user: { id: string; role: Role }) {
  const token = jwt.sign({ id: user.id, role: user.role, typ: "access" } satisfies AccessPayload, jwtSecret(), {
    expiresIn: ACCESS_TTL_SECONDS,
  });
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...cookieBase(),
    maxAge: ACCESS_TTL_SECONDS * 1000,
  });
}

async function persistRefreshToken(userId: string) {
  const raw = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(raw),
      expiresAt,
    },
  });
  return raw;
}

export async function issueSession(res: Response, user: { id: string; role: Role }) {
  setAccessCookie(res, user);
  const refresh = await persistRefreshToken(user.id);
  res.cookie(REFRESH_COOKIE_NAME, refresh, {
    ...cookieBase(),
    maxAge: REFRESH_TTL_SECONDS * 1000,
  });
}

/** Access cookie only — used when role changes mid-session. */
export function setAuthCookie(res: Response, user: { id: string; role: Role }) {
  setAccessCookie(res, user);
}

export async function rotateRefreshSession(res: Response, rawToken: string) {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, role: true, disabledAt: true } } },
  });
  if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now() || stored.user.disabledAt) {
    throw new ApiError(401, "UNAUTHENTICATED", "Session expired. Please sign in again.");
  }
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });
  await issueSession(res, stored.user);
  return stored.user;
}

export async function clearSession(res: Response, rawToken?: string) {
  if (rawToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  res.clearCookie(AUTH_COOKIE_NAME, cookieBase());
  res.clearCookie(REFRESH_COOKIE_NAME, cookieBase());
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, cookieBase());
  res.clearCookie(REFRESH_COOKIE_NAME, cookieBase());
}

export function signPasswordResetToken(input: {
  userId: string;
  email: string;
  method: "account" | "recovery";
}) {
  return jwt.sign(
    { ...input, typ: "password_reset" } satisfies ResetPayload,
    jwtSecret(),
    { expiresIn: RESET_TTL_SECONDS },
  );
}

export function verifyPasswordResetToken(token: string): ResetPayload {
  try {
    const payload = jwt.verify(token, jwtSecret()) as ResetPayload;
    if (payload.typ !== "password_reset" || !payload.userId || !payload.email) {
      throw new Error("invalid");
    }
    return payload;
  } catch {
    throw new ApiError(401, "RESET_TOKEN_INVALID", "Invalid or expired reset token");
  }
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
  if (!token) {
    next();
    return;
  }
  try {
    const payload = jwt.verify(token, jwtSecret()) as AccessPayload;
    if (payload.typ && payload.typ !== "access") {
      next();
      return;
    }
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
