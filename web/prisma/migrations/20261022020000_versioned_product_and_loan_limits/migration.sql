CREATE TABLE "loan_products" (
  "id" TEXT NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "version" INTEGER NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "interestRatePercent" INTEGER NOT NULL,
  "maximumTermMonths" INTEGER NOT NULL,
  "supportedFrequencies" "RepaymentFrequency"[],
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "loan_products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "loan_products_code_version_key" ON "loan_products"("code", "version");
CREATE INDEX "loan_products_code_isActive_idx" ON "loan_products"("code", "isActive");
ALTER TABLE "loans" ADD COLUMN "productId" TEXT;
ALTER TABLE "loans" ADD CONSTRAINT "loans_productId_fkey" FOREIGN KEY ("productId") REFERENCES "loan_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "loans_one_active_per_borrower" ON "loans"("borrowerId") WHERE "status" = 'ACTIVE';
CREATE UNIQUE INDEX "loans_one_nonterminal_application_per_borrower" ON "loans"("borrowerId") WHERE "status" IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'AWAITING_DISBURSEMENT');
