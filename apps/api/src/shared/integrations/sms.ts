/**
 * Reserved adapter boundary for SMS/OTP providers (Twilio, Msg91, etc.).
 * Keep implementations behind this interface when the notifications module ships.
 */
export interface SmsSender {
  send(to: string, body: string): Promise<void>;
}

export const SmsService: SmsSender = {
  async send() {
    throw new Error("SMS integration is not configured");
  },
};
