-- Stay / hotel room enquiries from guests to the property owner.

CREATE TYPE "StayEnquiryStatus" AS ENUM ('new', 'viewed', 'responded', 'closed');

CREATE TABLE "StayEnquiry" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "userId" UUID,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "checkIn" DATE NOT NULL,
    "checkOut" DATE NOT NULL,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "roomSelections" JSONB NOT NULL,
    "status" "StayEnquiryStatus" NOT NULL DEFAULT 'new',
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StayEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StayEnquiry_businessId_createdAt_idx" ON "StayEnquiry"("businessId", "createdAt");
CREATE INDEX "StayEnquiry_listingId_createdAt_idx" ON "StayEnquiry"("listingId", "createdAt");
CREATE INDEX "StayEnquiry_userId_idx" ON "StayEnquiry"("userId");
CREATE INDEX "StayEnquiry_status_createdAt_idx" ON "StayEnquiry"("status", "createdAt");

ALTER TABLE "StayEnquiry" ADD CONSTRAINT "StayEnquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StayEnquiry" ADD CONSTRAINT "StayEnquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StayEnquiry" ADD CONSTRAINT "StayEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
