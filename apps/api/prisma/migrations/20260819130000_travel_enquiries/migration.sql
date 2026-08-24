-- Travel / taxi / transport trip enquiries from guests to the operator.

CREATE TYPE "TravelEnquiryStatus" AS ENUM ('new', 'viewed', 'responded', 'closed');

CREATE TABLE "TravelEnquiry" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "userId" UUID,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "pickupDate" DATE NOT NULL,
    "pickupTime" TEXT,
    "pickupLocation" TEXT NOT NULL,
    "dropoffLocation" TEXT NOT NULL,
    "passengers" INTEGER NOT NULL DEFAULT 1,
    "roundTrip" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "vehicleSelections" JSONB NOT NULL,
    "status" "TravelEnquiryStatus" NOT NULL DEFAULT 'new',
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TravelEnquiry_businessId_createdAt_idx" ON "TravelEnquiry"("businessId", "createdAt");
CREATE INDEX "TravelEnquiry_listingId_createdAt_idx" ON "TravelEnquiry"("listingId", "createdAt");
CREATE INDEX "TravelEnquiry_userId_idx" ON "TravelEnquiry"("userId");
CREATE INDEX "TravelEnquiry_status_createdAt_idx" ON "TravelEnquiry"("status", "createdAt");

ALTER TABLE "TravelEnquiry" ADD CONSTRAINT "TravelEnquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelEnquiry" ADD CONSTRAINT "TravelEnquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelEnquiry" ADD CONSTRAINT "TravelEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
