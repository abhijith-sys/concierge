-- Rental & Hire item enquiries from customers to the vendor.

CREATE TYPE "RentalEnquiryStatus" AS ENUM ('new', 'viewed', 'responded', 'closed');

CREATE TABLE "RentalEnquiry" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "userId" UUID,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "hireFrom" DATE NOT NULL,
    "hireTo" DATE NOT NULL,
    "deliveryRequested" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "itemSelections" JSONB NOT NULL,
    "status" "RentalEnquiryStatus" NOT NULL DEFAULT 'new',
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RentalEnquiry_businessId_createdAt_idx" ON "RentalEnquiry"("businessId", "createdAt");
CREATE INDEX "RentalEnquiry_listingId_createdAt_idx" ON "RentalEnquiry"("listingId", "createdAt");
CREATE INDEX "RentalEnquiry_userId_idx" ON "RentalEnquiry"("userId");
CREATE INDEX "RentalEnquiry_status_createdAt_idx" ON "RentalEnquiry"("status", "createdAt");

ALTER TABLE "RentalEnquiry" ADD CONSTRAINT "RentalEnquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RentalEnquiry" ADD CONSTRAINT "RentalEnquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RentalEnquiry" ADD CONSTRAINT "RentalEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
