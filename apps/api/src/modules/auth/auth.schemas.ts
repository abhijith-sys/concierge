import { Role } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30).optional(),
  password: z.string().min(8).max(128),
  role: z.enum([Role.user, Role.business]).default(Role.user),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

export const otpRequestSchema = z.object({
  channel: z.enum(["email", "sms"]).default("email"),
  purpose: z.enum(["register", "login", "change"]).default("register"),
  phone: z.string().trim().min(7).max(30).optional(),
});

export const otpVerifySchema = z.object({
  channel: z.enum(["email", "sms"]).default("email"),
  purpose: z.enum(["register", "login", "change"]).default("register"),
  code: z.string().trim().regex(/^\d{6}$/),
});

const mediaUrl = z.string().min(1).max(500).refine((value) => {
  if (value.startsWith("/uploads/")) return true;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}, "Only HTTP(S) or /uploads paths are allowed");

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().min(7).max(30).nullable().optional(),
    avatarUrl: mediaUrl.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
