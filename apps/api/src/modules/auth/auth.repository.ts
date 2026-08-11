import { prisma } from "../../shared/db/prisma.js";
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

  createUser(data: {
    name: string;
    email: string;
    phone?: string;
    passwordHash: string;
    role: "user" | "business";
  }) {
    return prisma.user.create({
      data,
      select: publicUserSelect,
    });
  },
};
