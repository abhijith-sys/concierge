import { brand } from "../../shared/brand.js";
import { EmailService } from "../../shared/integrations/email.js";
import { logger } from "../../shared/logging/logger.js";

export async function sendGuestEnquiryConfirmation(input: {
  guestEmail: string;
  guestName: string;
  businessName: string;
  enquiryId: string;
  verticalLabel: string;
  detailLines?: string[];
}) {
  const refId = input.enquiryId.slice(0, 8).toUpperCase();
  try {
    await EmailService.send({
      to: input.guestEmail,
      subject: `Your enquiry to ${input.businessName} — ref ${refId}`,
      body: [
        `Hi ${input.guestName},`,
        "",
        `We received your ${input.verticalLabel} enquiry for ${input.businessName}.`,
        "",
        `Reference ID: ${refId}`,
        ...(input.detailLines?.length ? ["", ...input.detailLines] : []),
        "",
        "The business will contact you directly by phone or email.",
        `You can sign in to ${brand.name} to track enquiries linked to your account.`,
        "",
        `Thank you for using ${brand.name}.`,
      ].join("\n"),
    });
  } catch (error) {
    logger.warn("enquiry.guest_confirmation_failed", {
      enquiryId: input.enquiryId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function notifyBusinessOwnerStatus(input: {
  ownerEmail: string;
  businessName: string;
  status: "active" | "rejected" | "suspended";
  reason?: string | null;
}) {
  const subject =
    input.status === "active"
      ? `Your business "${input.businessName}" is now live`
      : input.status === "rejected"
        ? `Update on your business listing "${input.businessName}"`
        : `Your business "${input.businessName}" was suspended`;

  const body =
    input.status === "active"
      ? [
          `Good news — ${input.businessName} has been approved and is now visible on ${brand.name}.`,
          "",
          "Sign in to your provider dashboard to manage enquiries and catalog items.",
        ].join("\n")
      : input.status === "rejected"
        ? [
            `Your listing for ${input.businessName} was not approved at this time.`,
            input.reason ? `\nReason:\n${input.reason}` : "",
            "",
            "You can edit your profile and resubmit from the provider dashboard.",
          ]
            .filter(Boolean)
            .join("\n")
        : [
            `Your listing for ${input.businessName} has been suspended.`,
            input.reason ? `\nReason:\n${input.reason}` : "",
            "",
            "Contact support if you believe this was a mistake.",
          ]
            .filter(Boolean)
            .join("\n");

  try {
    await EmailService.send({ to: input.ownerEmail, subject, body });
  } catch (error) {
    logger.warn("business.status_notify_failed", {
      businessName: input.businessName,
      status: input.status,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function notifyGuestEnquiryStatusChange(input: {
  guestEmail: string;
  guestName: string;
  businessName: string;
  enquiryId: string;
  verticalLabel: string;
  status: "responded" | "closed";
}) {
  const refId = input.enquiryId.slice(0, 8).toUpperCase();
  const subject =
    input.status === "responded"
      ? `${input.businessName} responded to your enquiry — ref ${refId}`
      : `Your enquiry to ${input.businessName} is closed — ref ${refId}`;
  const body =
    input.status === "responded"
      ? [
          `Hi ${input.guestName},`,
          "",
          `${input.businessName} has marked your ${input.verticalLabel} enquiry as responded.`,
          "",
          `Reference ID: ${refId}`,
          "",
          "They should contact you directly by phone or email with next steps.",
          "",
          `Thank you for using ${brand.name}.`,
        ].join("\n")
      : [
          `Hi ${input.guestName},`,
          "",
          `Your ${input.verticalLabel} enquiry to ${input.businessName} has been closed.`,
          "",
          `Reference ID: ${refId}`,
          "",
          "If you still need help, you can submit a new enquiry from their profile.",
          "",
          `Thank you for using ${brand.name}.`,
        ].join("\n");

  try {
    await EmailService.send({ to: input.guestEmail, subject, body });
  } catch (error) {
    logger.warn("enquiry.guest_status_notify_failed", {
      enquiryId: input.enquiryId,
      status: input.status,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function notifyServiceApproval(input: {
  ownerEmail: string;
  serviceName: string;
  businessName: string;
  approvalStatus: "approved" | "rejected";
  reason?: string | null;
}) {
  const subject =
    input.approvalStatus === "approved"
      ? `Catalog item approved: ${input.serviceName}`
      : `Catalog item not approved: ${input.serviceName}`;

  const body =
    input.approvalStatus === "approved"
      ? [
          `"${input.serviceName}" for ${input.businessName} is now approved and visible.`,
          "",
          "Manage your catalog from the provider dashboard.",
        ].join("\n")
      : [
          `"${input.serviceName}" for ${input.businessName} was not approved.`,
          input.reason ? `\nReason:\n${input.reason}` : "",
          "",
          "Edit the item and resubmit from your provider dashboard.",
        ]
          .filter(Boolean)
          .join("\n");

  try {
    await EmailService.send({ to: input.ownerEmail, subject, body });
  } catch (error) {
    logger.warn("service.approval_notify_failed", {
      serviceName: input.serviceName,
      approvalStatus: input.approvalStatus,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
