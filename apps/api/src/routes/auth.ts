import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { EmailService } from "../lib/email.js";
import { ApiError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { clearAuthCookie, requireAuth, setAuthCookie } from "../middleware/auth.js";

export const authRouter = Router();

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} as const;

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30).optional(),
  password: z.string().min(8).max(128),
  role: z.enum([Role.user, Role.business]).default(Role.user),
});

authRouter.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);
  const email = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new ApiError(409, "EMAIL_IN_USE", "An account with this email already exists");
  }
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      phone: data.phone,
      passwordHash: await bcrypt.hash(data.password, 12),
      role: data.role,
    },
    select: publicUserSelect,
  });
  setAuthCookie(res, user);
  void EmailService.send(user.email, "Welcome to Concierge", `Welcome, ${user.name}.`);
  res.status(201).json({ user });
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

authRouter.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const record = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (!record || !(await bcrypt.compare(data.password, record.passwordHash))) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }
  setAuthCookie(res, record);
  const { passwordHash: _passwordHash, updatedAt: _updatedAt, ...user } = record;
  res.json({ user });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: publicUserSelect,
  });
  if (!user) {
    clearAuthCookie(res);
    throw new ApiError(401, "UNAUTHENTICATED", "Session user no longer exists");
  }
  res.json({ user });
});
