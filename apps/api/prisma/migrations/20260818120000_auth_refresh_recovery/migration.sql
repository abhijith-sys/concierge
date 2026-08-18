-- AlterEnum
ALTER TYPE "OtpPurpose" ADD VALUE 'reset';
ALTER TYPE "OtpPurpose" ADD VALUE 'recovery';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "recoveryEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "recoveryEmailVerifiedAt" TIMESTAMP(3);

CREATE INDEX "User_recoveryEmail_idx" ON "User"("recoveryEmail");

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
