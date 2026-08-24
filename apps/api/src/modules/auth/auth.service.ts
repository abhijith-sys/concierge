import bcrypt from "bcryptjs";
import { getEnv } from "../../config/env.js";
import { OTP_TTL_SECONDS } from "../../config/constants.js";
import { ApiError } from "../../shared/errors/index.js";
import { brand } from "../../shared/brand.js";
import { EmailService } from "../../shared/integrations/email.js";
import { SmsService } from "../../shared/integrations/sms.js";
import { generateOtpCode, hashOtp } from "../../shared/integrations/storage.js";
import { signPasswordResetToken, verifyPasswordResetToken } from "../../shared/auth/index.js";
import { assetsService } from "../assets/assets.service.js";
import { authRepository } from "./auth.repository.js";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  OtpRequestInput,
  OtpVerifyInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateMeInput,
  VerifyResetOtpInput,
} from "./auth.schemas.js";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function issueOtp(
  userId: string,
  input: { channel: "email" | "sms"; purpose: OtpRequestInput["purpose"]; phone?: string },
  destination: { email: string; phone?: string | null; name?: string },
) {
  if (input.channel === "sms") {
    const phone = input.phone ?? destination.phone;
    if (!phone) throw new ApiError(400, "PHONE_REQUIRED", "Phone number is required for SMS OTP");
  }

  const code = generateOtpCode();
  await authRepository.createOtp({
    userId,
    channel: input.channel,
    purpose: input.purpose,
    codeHash: hashOtp(code),
    expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
  });

  if (input.channel === "email") {
    await EmailService.send({
      to: destination.email,
      subject: `Your ${brand.name} verification code`,
      body: `Your verification code is ${code}. It expires in 10 minutes.`,
    });
  } else {
    const phone = input.phone ?? destination.phone!;
    try {
      await SmsService.send(phone, `${brand.name} code: ${code}`);
    } catch {
      await EmailService.send({
        to: destination.email,
        subject: `[SMS stub] ${brand.name} verification code`,
        body: `SMS to ${phone}: ${brand.name} code ${code}`,
      });
    }
  }

  return { sent: true as const, channel: input.channel, expiresInSeconds: OTP_TTL_SECONDS };
}

async function consumeOtp(
  userId: string,
  input: { channel: "email" | "sms"; purpose: OtpVerifyInput["purpose"]; code: string },
) {
  const challenge = await authRepository.findLatestOtp(userId, input.channel, input.purpose);
  if (!challenge) throw new ApiError(400, "OTP_NOT_FOUND", "No active verification challenge");
  if (challenge.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "OTP_EXPIRED", "Verification code expired");
  }
  if (challenge.attempts >= 5) {
    throw new ApiError(429, "OTP_LOCKED", "Too many invalid attempts");
  }
  if (challenge.codeHash !== hashOtp(input.code)) {
    await authRepository.bumpOtpAttempts(challenge.id);
    throw new ApiError(400, "OTP_INVALID", "Invalid verification code");
  }
  await authRepository.markOtpConsumed(challenge.id);
}

export const authService = {
  async register(input: RegisterInput) {
    const email = normalizeEmail(input.email);
    const recoveryEmail = input.recoveryEmail ? normalizeEmail(input.recoveryEmail) : undefined;
    const existing = await authRepository.findPublicByEmail(email);
    if (existing) {
      throw new ApiError(409, "EMAIL_IN_USE", "An account with this email already exists");
    }
    if (recoveryEmail) {
      const taken = await authRepository.findPublicByEmail(recoveryEmail);
      if (taken) {
        throw new ApiError(409, "EMAIL_IN_USE", "This recovery email is already in use on another account");
      }
    }
    const user = await authRepository.createUser({
      name: input.name,
      email,
      phone: input.phone,
      recoveryEmail,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: "user",
    });
    try {
      await issueOtp(user.id, { channel: "email", purpose: "register" }, { email: user.email, name: user.name });
    } catch (error) {
      console.error("[auth.register] verification email failed", error);
    }
    return authRepository.withAccess(user);
  },

  async login(input: LoginInput) {
    const record = await authRepository.findByEmail(normalizeEmail(input.email));
    if (!record || !(await bcrypt.compare(input.password, record.passwordHash))) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    }
    if (record.disabledAt) {
      throw new ApiError(403, "ACCOUNT_DISABLED", "This account has been disabled");
    }
    const { passwordHash: _passwordHash, updatedAt: _updatedAt, ...user } = record;
    return authRepository.withAccess(user);
  },

  async me(userId: string) {
    const user = await authRepository.findPublicById(userId);
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Session user no longer exists");
    }
    if (user.disabledAt) {
      throw new ApiError(403, "ACCOUNT_DISABLED", "This account has been disabled");
    }
    return authRepository.withAccess(user);
  },

  async updateMe(userId: string, input: UpdateMeInput) {
    const current = await authRepository.findPublicById(userId);
    if (!current) throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");

    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.avatarUrl !== undefined) patch.avatarUrl = input.avatarUrl;
    if (input.recoveryEmail !== undefined) {
      if (!input.recoveryEmail) {
        patch.recoveryEmail = null;
        patch.recoveryEmailVerifiedAt = null;
      } else {
        const recoveryEmail = normalizeEmail(input.recoveryEmail);
        if (recoveryEmail === normalizeEmail(current.email)) {
          throw new ApiError(400, "RECOVERY_SAME_AS_EMAIL", "Recovery email must be different from your login email");
        }
        const taken = await authRepository.findPublicByEmail(recoveryEmail);
        if (taken && taken.id !== userId) {
          throw new ApiError(409, "EMAIL_IN_USE", "This email is already in use on another account");
        }
        if (recoveryEmail !== (current.recoveryEmail ?? "").toLowerCase()) {
          patch.recoveryEmail = recoveryEmail;
          patch.recoveryEmailVerifiedAt = null;
        }
      }
    }

    const user = await authRepository.updateUser(userId, patch);
    if (input.avatarUrl !== undefined) {
      await assetsService.dualWriteUrl({
        url: input.avatarUrl,
        uploadedById: userId,
        entityType: "user",
        entityId: userId,
        purpose: "avatar",
      });
    }
    return authRepository.withAccess(user);
  },

  async requestOtp(userId: string, input: OtpRequestInput) {
    const user = await authRepository.findPublicById(userId);
    if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    if (input.phone) await authRepository.updateUser(userId, { phone: input.phone });
    return issueOtp(userId, input, { email: user.email, phone: input.phone ?? user.phone, name: user.name });
  },

  async verifyOtp(userId: string, input: OtpVerifyInput) {
    await consumeOtp(userId, input);
    const patch =
      input.channel === "email"
        ? input.purpose === "recovery"
          ? { recoveryEmailVerifiedAt: new Date() }
          : { emailVerifiedAt: new Date() }
        : { phoneVerifiedAt: new Date() };
    const user = await authRepository.updateUser(userId, patch);
    return authRepository.withAccess(user);
  },

  async verifySignupOtp(userId: string, code: string) {
    const user = await authRepository.findPublicById(userId);
    if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    if (user.emailVerifiedAt) return authRepository.withAccess(user);
    return this.verifyOtp(userId, { channel: "email", purpose: "register", code });
  },

  async resendSignupOtp(userId: string) {
    const user = await authRepository.findPublicById(userId);
    if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    if (user.emailVerifiedAt) {
      throw new ApiError(400, "ALREADY_VERIFIED", "Email is already verified");
    }
    return issueOtp(userId, { channel: "email", purpose: "register" }, { email: user.email, name: user.name });
  },

  async forgotPassword(input: ForgotPasswordInput) {
    const email = normalizeEmail(input.email);
    const user =
      input.method === "recovery"
        ? await authRepository.findByRecoveryEmail(email)
        : await authRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(
        404,
        "ACCOUNT_NOT_FOUND",
        input.method === "recovery"
          ? "No account has this verified recovery email"
          : "The email is not registered",
      );
    }
    const destination = input.method === "recovery" ? email : user.email;
    return issueOtp(user.id, { channel: "email", purpose: "reset" }, { email: destination, name: user.name });
  },

  async verifyResetOtp(input: VerifyResetOtpInput) {
    const email = normalizeEmail(input.email);
    const user =
      input.method === "recovery"
        ? await authRepository.findByRecoveryEmail(email)
        : await authRepository.findByEmail(email);
    if (!user) throw new ApiError(400, "OTP_INVALID", "Invalid or expired OTP");
    await consumeOtp(user.id, { channel: "email", purpose: "reset", code: input.code });
    const resetToken = signPasswordResetToken({
      userId: user.id,
      email,
      method: input.method,
    });
    return { resetToken };
  },

  async resetPassword(input: ResetPasswordInput) {
    const email = normalizeEmail(input.email);
    const decoded = verifyPasswordResetToken(input.resetToken);
    if (normalizeEmail(decoded.email) !== email || decoded.method !== input.method) {
      throw new ApiError(401, "RESET_TOKEN_INVALID", "Invalid or expired reset token");
    }
    const user = await authRepository.findAuthById(decoded.userId);
    if (!user) throw new ApiError(401, "RESET_TOKEN_INVALID", "Invalid or expired reset token");
    if (input.method === "recovery") {
      if (!user.recoveryEmailVerifiedAt || normalizeEmail(user.recoveryEmail ?? "") !== email) {
        throw new ApiError(401, "RESET_TOKEN_INVALID", "Invalid or expired reset token");
      }
    } else if (normalizeEmail(user.email) !== email) {
      throw new ApiError(401, "RESET_TOKEN_INVALID", "Invalid or expired reset token");
    }
    await authRepository.updateUser(user.id, {
      passwordHash: await bcrypt.hash(input.newPassword, 12),
    });
    return { updated: true as const };
  },

  async sendRecoveryEmailOtp(userId: string) {
    const user = await authRepository.findPublicById(userId);
    if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    if (!user.recoveryEmail) {
      throw new ApiError(400, "RECOVERY_EMAIL_REQUIRED", "Add a recovery email before requesting a verification code");
    }
    if (user.recoveryEmailVerifiedAt) {
      return { sent: true, alreadyVerified: true as const, expiresInSeconds: OTP_TTL_SECONDS };
    }
    return issueOtp(
      userId,
      { channel: "email", purpose: "recovery" },
      { email: user.recoveryEmail, name: user.name },
    );
  },

  async verifyRecoveryEmailOtp(userId: string, code: string) {
    const user = await authRepository.findPublicById(userId);
    if (!user?.recoveryEmail) throw new ApiError(400, "RECOVERY_EMAIL_REQUIRED", "No recovery email on file");
    if (user.recoveryEmailVerifiedAt) return authRepository.withAccess(user);
    await consumeOtp(userId, { channel: "email", purpose: "recovery", code });
    const next = await authRepository.updateUser(userId, { recoveryEmailVerifiedAt: new Date() });
    return authRepository.withAccess(next);
  },

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await authRepository.findAuthById(userId);
    if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw new ApiError(400, "INVALID_PASSWORD", "Current password is incorrect");
    }
    if (await bcrypt.compare(input.newPassword, user.passwordHash)) {
      throw new ApiError(400, "PASSWORD_UNCHANGED", "New password must be different from your current password");
    }
    const next = await authRepository.updateUser(userId, {
      passwordHash: await bcrypt.hash(input.newPassword, 12),
    });
    return authRepository.withAccess(next);
  },

  assertEmailVerified(user: { emailVerifiedAt?: Date | string | null }) {
    if (!user.emailVerifiedAt) {
      throw new ApiError(403, "EMAIL_UNVERIFIED", "Verify your email before continuing");
    }
  },

  assertEmailVerifiedIfRequired(user: { role: string; emailVerifiedAt?: Date | null }) {
    const env = getEnv();
    const required =
      env.REQUIRE_EMAIL_VERIFICATION ||
      env.NODE_ENV === "production" ||
      user.role === "business";
    if (required && !user.emailVerifiedAt && env.NODE_ENV !== "test") {
      if (env.REQUIRE_EMAIL_VERIFICATION || env.NODE_ENV === "production") {
        throw new ApiError(403, "EMAIL_UNVERIFIED", "Verify your email before continuing");
      }
    }
  },
};
