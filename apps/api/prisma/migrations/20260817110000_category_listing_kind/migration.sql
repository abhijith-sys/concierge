-- Supplier vs service-professional intent on categories and frozen on listings.

CREATE TYPE "CategoryKind" AS ENUM ('supplier', 'service');

ALTER TABLE "Category" ADD COLUMN "kind" "CategoryKind" NOT NULL DEFAULT 'supplier';
ALTER TABLE "Listing" ADD COLUMN "listingKind" "CategoryKind" NOT NULL DEFAULT 'supplier';

CREATE INDEX "Category_kind_idx" ON "Category"("kind");
CREATE INDEX "Listing_listingKind_idx" ON "Listing"("listingKind");
