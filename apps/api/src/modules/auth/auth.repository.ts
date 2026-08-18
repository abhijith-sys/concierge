import type { OtpChannel, OtpPurpose, Role } from "@prisma/client";
import { prisma } from "../../shared/db/prisma.js";
import {
  assignDefaultRoleForLegacy,
  getPermissionKeysForUser,
  getRoleKeysForUser,
} from "../../shared/auth/rbac.service.js";
import { publicUserSelect } from "./auth.types.js";

export const authRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findPublicByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, select: { id: true } });
  },

  findByRecoveryEmail(email: string) {
    return prisma.user.findFirst({
      where: { recoveryEmail: email, recoveryEmailVerifiedAt: { not: null } },
      select: publicUserSelect,
    });
  },

  findPublicById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  },

  findAuthById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { ...publicUserSelect, passwordHash: true },
    });
  },

  async createUser(data: {
    name: string;
    email: string;
    phone?: string;
    recoveryEmail?: string;
    passwordHash: string;
    role: "user" | "business";
  }) {
    const user = await prisma.user.create({
      data,
      select: publicUserSelect,
    });
    await assignDefaultRoleForLegacy(user.id, data.role);
    return user;
  },

  updateUser(id: string, data: Record<string, unknown>) {
    return prisma.user.update({ where: { id }, data, select: publicUserSelect });
  },

  async withAccess(user: { id: string; role: Role } & Record<string, unknown>) {
    const [permissions, roles, businessCount] = await Promise.all([
      getPermissionKeysForUser(user.id, user.role),
      getRoleKeysForUser(user.id),
      prisma.business.count({ where: { ownerId: user.id, status: { not: "deleted" } } }),
    ]);
    return { ...user, permissions, roles, businessCount };
  },

  createOtp(data: {
    userId: string;
    channel: OtpChannel;
    purpose: OtpPurpose;
    codeHash: string;
    expiresAt: Date;
  }) {
    return prisma.verificationChallenge.create({ data });
  },

  findLatestOtp(userId: string, channel: OtpChannel, purpose: OtpPurpose) {
    return prisma.verificationChallenge.findFirst({
      where: { userId, channel, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
  },

  markOtpConsumed(id: string) {
    return prisma.verificationChallenge.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  },

  bumpOtpAttempts(id: string) {
    return prisma.verificationChallenge.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  },
};
