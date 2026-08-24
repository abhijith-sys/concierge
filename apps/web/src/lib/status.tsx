import type { Business, Service } from "./api";

export type StatusTone = "pending" | "active" | "danger" | "muted";

export function businessStatus(business: Pick<Business, "status">): { label: string; tone: StatusTone } {
  switch (business.status) {
    case "active":
      return { label: "Active", tone: "active" };
    case "rejected":
      return { label: "Rejected", tone: "danger" };
    case "suspended":
      return { label: "Disabled by admin", tone: "muted" };
    case "deleted":
      return { label: "Deleted", tone: "muted" };
    default:
      return { label: "Pending", tone: "pending" };
  }
}

export function canAddItems(business: Pick<Business, "status">) {
  return business.status === "active" || business.status === "pending" || !business.status;
}

export function listingStatus(service: Pick<Service, "approvalStatus" | "isActive">): {
  label: string;
  tone: StatusTone;
} {
  if (service.approvalStatus === "pending") return { label: "Pending verification", tone: "pending" };
  if (service.approvalStatus === "rejected") return { label: "Rejected", tone: "danger" };
  if (service.approvalStatus === "draft") return { label: "Draft", tone: "muted" };
  if (service.isActive) return { label: "Posted", tone: "active" };
  return { label: "Disabled", tone: "muted" };
}

const toneClass: Record<StatusTone, string> = {
  pending: "bg-amber-50 text-amber-800",
  active: "bg-emerald-50 text-emerald-800",
  danger: "bg-red-50 text-red-800",
  muted: "bg-slate-100 text-slate-700",
};

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${toneClass[tone]}`}>{label}</span>
  );
}
