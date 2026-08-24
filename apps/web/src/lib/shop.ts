import type { FieldValue, Service } from "./api";
import { displayValue, fieldByKey } from "./field-values";

/** Brand shown on supplier catalog cards when the offer carries a brand field. */
export function catalogOfferBrand(offer?: Pick<Service, "fieldValues"> | null, listingFields?: FieldValue[]) {
  const fromOffer = displayValue(fieldByKey(offer?.fieldValues, "brand")?.value);
  if (fromOffer) return fromOffer;
  return displayValue(fieldByKey(listingFields, "brand")?.value);
}
