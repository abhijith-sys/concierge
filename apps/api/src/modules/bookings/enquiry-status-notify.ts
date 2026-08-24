import { notifyGuestEnquiryStatusChange } from "./enquiry-notifications.js";

type EnquiryWithGuest = {
  id: string;
  status: string;
  guestEmail: string;
  guestName: string;
  business: { name: string };
};

export async function notifyGuestIfStatusChanged(
  existing: EnquiryWithGuest,
  nextStatus: string | undefined,
  verticalLabel: string,
) {
  if (!nextStatus || nextStatus === existing.status) return;
  if (nextStatus !== "responded" && nextStatus !== "closed") return;
  await notifyGuestEnquiryStatusChange({
    guestEmail: existing.guestEmail,
    guestName: existing.guestName,
    businessName: existing.business.name,
    enquiryId: existing.id,
    verticalLabel,
    status: nextStatus,
  });
}
