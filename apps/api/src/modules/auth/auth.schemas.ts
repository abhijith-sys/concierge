import { Role } from "@prisma/client";
import { z } from "zod";

const email = z.string().trim().email("Enter a valid email address.").max(254);
const phone = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Enter a valid phone number with country code.");
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128)
  .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
  .regex(/\d/, "Password must include at least one number.");

const optionalPhone = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  phone.optional(),
);
const optionalEmail = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  email.optional(),
);

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(100),
    email,
    phone: optionalPhone,
    recoveryEmail: optionalEmail,
    password: strongPassword,
    /** Ignored. Signup is always a consumer; provider capability is added later. */
    role: z.enum([Role.user, Role.business]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.recoveryEmail && data.recoveryEmail.toLowerCase() === data.email.toLowerCase()) {
      ctx.addIssue({
        code: "custom",
        path: ["recoveryEmail"],
        message: "Recovery email must be different from your login email.",
      });
    }
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(128),
});

const otpPurpose = z.enum(["register", "login", "change", "reset", "recovery"]);

export const otpRequestSchema = z.object({
  channel: z.enum(["email", "sms"]).default("email"),
  purpose: otpPurpose.default("register"),
  phone: optionalPhone,
});

export const otpVerifySchema = z.object({
  channel: z.enum(["email", "sms"]).default("email"),
  purpose: otpPurpose.default("register"),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const verifySignupOtpSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const forgotPasswordSchema = z.object({
  email,
  method: z.enum(["account", "recovery"]).default("account"),
});

export const verifyResetOtpSchema = z.object({
  email,
  method: z.enum(["account", "recovery"]).default("account"),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const resetPasswordSchema = z.object({
  email,
  method: z.enum(["account", "recovery"]).default("account"),
  newPassword: strongPassword,
  resetToken: z.string().min(10),
});

export const verifyRecoveryOtpSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
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
    phone: z.preprocess(
      (value) => (value === "" ? null : value),
      phone.nullable().optional(),
    ),
    avatarUrl: mediaUrl.nullable().optional(),
    recoveryEmail: z.preprocess(
      (value) => (value === "" ? null : value),
      email.nullable().optional(),
    ),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: strongPassword,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
