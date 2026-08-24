import nodemailer from "nodemailer";
import { getEnv } from "../../config/env.js";
import { brand } from "../brand.js";
import { logger } from "../logging/logger.js";

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toHtml(subject: string, body: string) {
  const otpMatch = body.match(/\b(\d{6})\b/);
  const otpBlock = otpMatch
    ? `<p style="margin:24px 0;letter-spacing:0.35em;font-size:28px;font-weight:700;color:#111827;">${otpMatch[1]}</p>`
    : "";
  const paragraphs = escapeHtml(body)
    .split(/\n+/)
    .map((line) => `<p style="margin:0 0 12px;">${line}</p>`)
    .join("");
  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.55;color:#111827;background:#f8fafc;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#b45309;">${escapeHtml(brand.name)}</p>
    <h1 style="margin:0 0 16px;font-size:22px;">${escapeHtml(subject)}</h1>
    ${otpBlock}
    ${paragraphs}
  </div>
</body>
</html>`;
}

function createTransport() {
  const env = getEnv();
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || env.NODE_ENV === "test") {
    return null;
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export const EmailService: EmailSender = {
  async send(message) {
    const env = getEnv();
    const transport = createTransport();
    if (!transport) {
      logger.info("email.stub", {
        to: message.to,
        subject: message.subject,
        body: message.body,
        reason: env.NODE_ENV === "test" ? "test" : "smtp_unconfigured",
      });
      return;
    }

    const from = env.SMTP_FROM || env.SMTP_USER;
    try {
      await transport.sendMail({
        from: `"${brand.name}" <${from}>`,
        to: message.to,
        subject: message.subject,
        text: message.body,
        html: toHtml(message.subject, message.body),
      });
      logger.info("email.sent", { to: message.to, subject: message.subject, from });
    } catch (error) {
      logger.error("email.send_failed", {
        to: message.to,
        subject: message.subject,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
};
