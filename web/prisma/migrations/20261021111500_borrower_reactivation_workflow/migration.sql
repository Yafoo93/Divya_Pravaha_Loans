CREATE TYPE "BorrowerRestrictionStatus" AS ENUM (
  'ACTIVE',
  'REACTIVATION_PENDING',
  'REACTIVATED',
  'REACTIVATION_REJECTED'
);

CREATE TABLE "borrower_restrictions" (
  "id" TEXT NOT NULL,
  "restrictionNumber" VARCHAR(40) NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "status" "BorrowerRestrictionStatus" NOT NULL DEFAULT 'ACTIVE',
  "restrictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reactivationReason" VARCHAR(500),
  "requestedAt" TIMESTAMP(3),
  "decisionReason" VARCHAR(500),
  "decidedAt" TIMESTAMP(3),
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "borrowerId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "restrictedByUserId" TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "decidedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "borrower_restrictions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "borrower_restrictions_restrictionNumber_key"
ON "borrower_restrictions"("restrictionNumber");
CREATE INDEX "borrower_restrictions_borrowerId_createdAt_idx"
ON "borrower_restrictions"("borrowerId", "createdAt");
CREATE INDEX "borrower_restrictions_branchId_status_idx"
ON "borrower_restrictions"("branchId", "status");
CREATE INDEX "borrower_restrictions_status_requestedAt_idx"
ON "borrower_restrictions"("status", "requestedAt");

ALTER TABLE "borrower_restrictions"
ADD CONSTRAINT "borrower_restrictions_borrowerId_fkey"
FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "borrower_restrictions"
ADD CONSTRAINT "borrower_restrictions_branchId_fkey"
FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "borrower_restrictions"
ADD CONSTRAINT "borrower_restrictions_restrictedByUserId_fkey"
FOREIGN KEY ("restrictedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "borrower_restrictions"
ADD CONSTRAINT "borrower_restrictions_requestedByUserId_fkey"
FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "borrower_restrictions"
ADD CONSTRAINT "borrower_restrictions_decidedByUserId_fkey"
FOREIGN KEY ("decidedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
