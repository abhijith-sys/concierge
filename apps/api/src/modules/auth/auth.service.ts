import bcrypt from "bcryptjs";
import { getEnv } from "../../config/env.js";
import { ApiError } from "../../shared/errors/index.js";
import { EmailService } from "../../shared/integrations/email.js";
import { SmsService } from "../../shared/integrations/sms.js";
import { generateOtpCode, hashOtp } from "../../shared/integrations/storage.js";
import { assetsService } from "../assets/assets.service.js";
import { authRepository } from "./auth.repository.js";
import type {
  LoginInput,
  OtpRequestInput,
  OtpVerifyInput,
  RegisterInput,
  UpdateMeInput,
} from "./auth.schemas.js";

export const authService = {
  async register(input: RegisterInput) {
    const email = input.email.toLowerCase();
    const existing = await authRepository.findPublicByEmail(email);
    if (existing) {
      throw new ApiError(409, "EMAIL_IN_USE", "An account with this email already exists");
    }
    const user = await authRepository.createUser({
      name: input.name,
      email,
      phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: "user",
    });
    void EmailService.send({
      to: user.email,
      subject: "Welcome to Concierge",
      body: `Welcome, ${user.name}. Verify your email to continue.`,
    });
    return authRepository.withAccess(user);
  },

  async login(input: LoginInput) {
    const record = await authRepository.findByEmail(input.email.toLowerCase());
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
    const user = await authRepository.updateUser(userId, input);
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

    if (input.channel === "sms") {
      const phone = input.phone ?? user.phone;
      if (!phone) throw new ApiError(400, "PHONE_REQUIRED", "Phone number is required for SMS OTP");
      if (input.phone) await authRepository.updateUser(userId, { phone: input.phone });
    }

    const code = generateOtpCode();
    await authRepository.createOtp({
      userId,
      channel: input.channel,
      purpose: input.purpose,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });

    if (input.channel === "email") {
      await EmailService.send({
        to: user.email,
        subject: "Your Concierge verification code",
        body: `Your verification code is ${code}. It expires in 10 minutes.`,
      });
    } else {
      const phone = input.phone ?? user.phone!;
      try {
        await SmsService.send(phone, `Concierge code: ${code}`);
      } catch {
        // Local stub logs via email adapter fallback for developer visibility.
        await EmailService.send({
          to: user.email,
          subject: "[SMS stub] Concierge verification code",
          body: `SMS to ${phone}: Concierge code ${code}`,
        });
      }
    }

    return { sent: true, channel: input.channel, expiresInSeconds: 600 };
  },

  async verifyOtp(userId: string, input: OtpVerifyInput) {
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
    const patch =
      input.channel === "email"
        ? { emailVerifiedAt: new Date() }
        : { phoneVerifiedAt: new Date() };
    const user = await authRepository.updateUser(userId, patch);
    return authRepository.withAccess(user);
  },

  assertEmailVerifiedIfRequired(user: { role: string; emailVerifiedAt?: Date | null }) {
    const env = getEnv();
    const required =
      env.REQUIRE_EMAIL_VERIFICATION ||
      env.NODE_ENV === "production" ||
      user.role === "business";
    if (required && !user.emailVerifiedAt && env.NODE_ENV !== "test") {
      // In development with REQUIRE_EMAIL_VERIFICATION=false, business still encouraged but not blocked unless flag set.
      if (env.REQUIRE_EMAIL_VERIFICATION || env.NODE_ENV === "production") {
        throw new ApiError(403, "EMAIL_UNVERIFIED", "Verify your email before continuing");
      }
    }
  },
};
