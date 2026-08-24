import { getEnv } from "../../config/env.js";
import { logger } from "../logging/logger.js";

/**
 * SMS adapter boundary (Twilio REST API when configured; console stub in dev).
 */
export interface SmsSender {
  send(to: string, body: string): Promise<void>;
}

async function sendViaTwilio(to: string, body: string) {
  const env = getEnv();
  const sid = env.TWILIO_ACCOUNT_SID!;
  const token = env.TWILIO_AUTH_TOKEN!;
  const from = env.TWILIO_FROM_NUMBER!;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Twilio HTTP ${response.status}: ${detail.slice(0, 200)}`);
  }
}

export const SmsService: SmsSender = {
  async send(to, body) {
    const env = getEnv();
    const configured =
      env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER && env.NODE_ENV !== "test";
    if (!configured) {
      logger.info("sms.stub", {
        to,
        body,
        reason: env.NODE_ENV === "test" ? "test" : "twilio_unconfigured",
      });
      return;
    }

    try {
      await sendViaTwilio(to, body);
      logger.info("sms.sent", { to });
    } catch (error) {
      logger.error("sms.send_failed", {
        to,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
};
