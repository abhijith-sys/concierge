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

  findPublicById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  },

  async createUser(data: {
    name: string;
    email: string;
    phone?: string;
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

  async withAccess(user: { id: string; role: "user" | "business" | "admin" } & Record<string, unknown>) {
    const [permissions, roles] = await Promise.all([
      getPermissionKeysForUser(user.id, user.role),
      getRoleKeysForUser(user.id),
    ]);
    return { ...user, permissions, roles };
  },

  createOtp(data: {
    userId: string;
    channel: "email" | "sms";
    purpose: "register" | "login" | "change";
    codeHash: string;
    expiresAt: Date;
  }) {
    return prisma.verificationChallenge.create({ data });
  },

  findLatestOtp(userId: string, channel: "email" | "sms", purpose: "register" | "login" | "change") {
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
