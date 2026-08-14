import type { User } from "./api";

export function isProvider(user: User | null | undefined) {
  if (!user) return false;
  if (user.role === "business" || user.role === "admin") return true;
  if (user.roles?.includes("service_provider")) return true;
  return (user.businessCount ?? 0) > 0;
}
