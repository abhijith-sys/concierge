import type { Service } from "./api";

export function formatListingPrice(
  service: Pick<Service, "price" | "currency" | "pricingType">,
) {
  if (service.pricingType === "contact") return "Contact for price";
  const amount = `${service.currency} ${Number(service.price).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
  if (service.pricingType === "starting_from") return `From ${amount}`;
  if (service.pricingType === "hourly") return `${amount}/hr`;
  if (service.pricingType === "daily") return `${amount}/day`;
  if (service.pricingType === "monthly") return `${amount}/mo`;
  return amount;
}
