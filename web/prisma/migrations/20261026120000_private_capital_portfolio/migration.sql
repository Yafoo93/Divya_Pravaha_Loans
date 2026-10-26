CREATE TYPE "CapitalContributorType" AS ENUM ('OWNER', 'FAMILY', 'OTHER_PRIVATE');
CREATE TYPE "PrivateInvestmentStatus" AS ENUM ('ACTIVE', 'MATURED', 'CLOSED', 'CANCELLED');
CREATE TYPE "InvestorPayoutType" AS ENUM ('RETURN', 'PRINCIPAL', 'MIXED');
CREATE TYPE "InvestorPayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');
ALTER TYPE "FundSourceType" ADD VALUE 'OTHER_INCOME';

CREATE TABLE "capital_contributors" (
  "id" TEXT PRIMARY KEY,
  "contributorNumber" VARCHAR(40) NOT NULL UNIQUE,
  "type" "CapitalContributorType" NOT NULL,
  "legalName" VARCHAR(150) NOT NULL,
  "phone" VARCHAR(30), "email" VARCHAR(254), "identityReference" VARCHAR(80),
  "address" VARCHAR(300), "relationshipNote" VARCHAR(200),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "branchId" TEXT NOT NULL REFERENCES "branches"("id") ON DELETE RESTRICT,
  "createdByUserId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "capital_contributors_branchId_type_isActive_idx" ON "capital_contributors"("branchId", "type", "isActive");
CREATE INDEX "capital_contributors_legalName_idx" ON "capital_contributors"("legalName");

CREATE TABLE "private_investments" (
  "id" TEXT PRIMARY KEY,
  "contractNumber" VARCHAR(50) NOT NULL UNIQUE,
  "principalPesewas" INTEGER NOT NULL CHECK ("principalPesewas" > 0),
  "annualReturnBps" INTEGER NOT NULL DEFAULT 6000 CHECK ("annualReturnBps" = 6000),
  "dayBasis" INTEGER NOT NULL DEFAULT 365 CHECK ("dayBasis" IN (365, 366)),
  "startDate" TIMESTAMP(3) NOT NULL,
  "maturityDate" TIMESTAMP(3) NOT NULL,
  "clearedAt" TIMESTAMP(3) NOT NULL,
  "evidenceReference" VARCHAR(120) NOT NULL,
  "status" "PrivateInvestmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "accruedReturnPesewas" INTEGER NOT NULL DEFAULT 0,
  "returnPaidPesewas" INTEGER NOT NULL DEFAULT 0,
  "principalRepaidPesewas" INTEGER NOT NULL DEFAULT 0,
  "branchId" TEXT NOT NULL REFERENCES "branches"("id") ON DELETE RESTRICT,
  "contributorId" TEXT NOT NULL REFERENCES "capital_contributors"("id") ON DELETE RESTRICT,
  "fundLotId" TEXT NOT NULL UNIQUE REFERENCES "fund_lots"("id") ON DELETE RESTRICT,
  "createdByUserId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CHECK ("maturityDate" > "startDate"),
  CHECK ("accruedReturnPesewas" >= 0 AND "returnPaidPesewas" >= 0 AND "principalRepaidPesewas" >= 0),
  CHECK ("principalRepaidPesewas" <= "principalPesewas"),
  CHECK ("returnPaidPesewas" <= "accruedReturnPesewas")
);
CREATE INDEX "private_investments_branchId_status_maturityDate_idx" ON "private_investments"("branchId", "status", "maturityDate");
CREATE INDEX "private_investments_contributorId_status_idx" ON "private_investments"("contributorId", "status");

CREATE TABLE "investor_return_accruals" (
  "id" TEXT PRIMARY KEY,
  "accrualNumber" VARCHAR(60) NOT NULL UNIQUE,
  "fromDate" TIMESTAMP(3) NOT NULL, "throughDate" TIMESTAMP(3) NOT NULL,
  "daysAccrued" INTEGER NOT NULL CHECK ("daysAccrued" > 0),
  "amountPesewas" INTEGER NOT NULL CHECK ("amountPesewas" > 0),
  "sourceReference" VARCHAR(80) NOT NULL UNIQUE,
  "investmentId" TEXT NOT NULL REFERENCES "private_investments"("id") ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("investmentId", "throughDate")
);
CREATE INDEX "investor_return_accruals_investmentId_throughDate_idx" ON "investor_return_accruals"("investmentId", "throughDate");

CREATE TABLE "investor_payouts" (
  "id" TEXT PRIMARY KEY,
  "payoutNumber" VARCHAR(60) NOT NULL UNIQUE,
  "idempotencyKey" VARCHAR(100) NOT NULL UNIQUE,
  "type" "InvestorPayoutType" NOT NULL,
  "returnAmountPesewas" INTEGER NOT NULL DEFAULT 0,
  "principalAmountPesewas" INTEGER NOT NULL DEFAULT 0,
  "reason" VARCHAR(500) NOT NULL,
  "payeeVerified" BOOLEAN NOT NULL DEFAULT false,
  "status" "InvestorPayoutStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3), "paidAt" TIMESTAMP(3),
  "decisionReason" VARCHAR(500), "paymentReference" VARCHAR(100),
  "branchId" TEXT NOT NULL REFERENCES "branches"("id") ON DELETE RESTRICT,
  "investmentId" TEXT NOT NULL REFERENCES "private_investments"("id") ON DELETE RESTRICT,
  "requestedByUserId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "decidedByUserId" TEXT REFERENCES "users"("id") ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CHECK ("returnAmountPesewas" >= 0 AND "principalAmountPesewas" >= 0),
  CHECK ("returnAmountPesewas" + "principalAmountPesewas" > 0)
);
CREATE INDEX "investor_payouts_branchId_status_requestedAt_idx" ON "investor_payouts"("branchId", "status", "requestedAt");
CREATE INDEX "investor_payouts_investmentId_status_idx" ON "investor_payouts"("investmentId", "status");

UPDATE "roles" SET "permissions" = ARRAY(
  SELECT DISTINCT unnest("permissions" || ARRAY['manage_capital_sources','manage_private_investors','prepare_investor_payouts','approve_investor_payouts'])
) WHERE "code" = 'MANAGER';
UPDATE "roles" SET "permissions" = ARRAY(
  SELECT DISTINCT unnest("permissions" || ARRAY['manage_capital_sources','manage_private_investors','prepare_investor_payouts'])
), "featureGate" = NULL WHERE "code" = 'INVESTOR_PORTFOLIO_OFFICER';
UPDATE "roles" SET "featureGate" = NULL WHERE "code" = 'INVESTOR_PORTAL_USER';
