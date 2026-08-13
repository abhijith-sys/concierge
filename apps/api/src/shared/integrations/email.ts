import { logger } from "../logging/logger.js";

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

export const EmailService: EmailSender = {
  async send(message) {
    logger.info("email.stub", {
      to: message.to,
      subject: message.subject,
      body: message.body,
    });
  },
};
