CREATE TYPE "FundSourceType" AS ENUM (
  'OWNER_CAPITAL', 'RECOVERED_PRINCIPAL', 'INTEREST_INCOME',
  'INVESTOR_PRINCIPAL', 'EXCLUDED_CUSTODY', 'EXCLUDED_RECEIVABLE',
  'EXCLUDED_SUSPENSE', 'EXCLUDED_OVERPAYMENT'
);

CREATE TYPE "FundLotStatus" AS ENUM (
  'AVAILABLE', 'RESERVED', 'COMMITTED', 'DISBURSED', 'RECOVERED', 'CANCELLED'
);

CREATE TABLE "fund_accounts" (
  "id" TEXT NOT NULL,
  "accountNumber" VARCHAR(50) NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "sourceType" "FundSourceType" NOT NULL,
  "eligibleForFunding" BOOLEAN NOT NULL DEFAULT false,
  "exclusionReason" VARCHAR(300),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "branchId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fund_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fund_lots" (
  "id" TEXT NOT NULL,
  "lotNumber" VARCHAR(50) NOT NULL,
  "description" VARCHAR(300) NOT NULL,
  "evidenceReference" VARCHAR(120) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "originalPesewas" INTEGER NOT NULL,
  "availablePesewas" INTEGER NOT NULL,
  "reservedPesewas" INTEGER NOT NULL DEFAULT 0,
  "committedPesewas" INTEGER NOT NULL DEFAULT 0,
  "disbursedPesewas" INTEGER NOT NULL DEFAULT 0,
  "recoveredPesewas" INTEGER NOT NULL DEFAULT 0,
  "status" "FundLotStatus" NOT NULL DEFAULT 'AVAILABLE',
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "fundAccountId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fund_lots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fund_lot_nonnegative_balances" CHECK (
    "originalPesewas" > 0 AND "availablePesewas" >= 0 AND
    "reservedPesewas" >= 0 AND "committedPesewas" >= 0 AND
    "disbursedPesewas" >= 0 AND "recoveredPesewas" >= 0
  ),
  CONSTRAINT "fund_lot_balance_limit" CHECK (
    "availablePesewas" + "reservedPesewas" + "committedPesewas" + "disbursedPesewas" <=
    "originalPesewas" + "recoveredPesewas"
  )
);

CREATE TABLE "fund_movements" (
  "id" TEXT NOT NULL,
  "movementNumber" VARCHAR(60) NOT NULL,
  "movementType" "FundLotStatus" NOT NULL,
  "sourceReference" VARCHAR(100) NOT NULL,
  "amountPesewas" INTEGER NOT NULL,
  "principalAmountPesewas" INTEGER NOT NULL DEFAULT 0,
  "interestAmountPesewas" INTEGER NOT NULL DEFAULT 0,
  "notes" VARCHAR(500) NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "fundLotId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fund_movements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fund_movement_amounts" CHECK (
    "amountPesewas" > 0 AND "principalAmountPesewas" >= 0 AND
    "interestAmountPesewas" >= 0 AND
    "principalAmountPesewas" + "interestAmountPesewas" <= "amountPesewas"
  )
);

CREATE TABLE "funding_reservations" (
  "id" TEXT NOT NULL,
  "reservationNumber" VARCHAR(60) NOT NULL,
  "amountPesewas" INTEGER NOT NULL,
  "status" "FundLotStatus" NOT NULL DEFAULT 'RESERVED',
  "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "committedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "fundLotId" TEXT NOT NULL,
  "loanId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "funding_reservations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "funding_reservation_positive" CHECK ("amountPesewas" > 0),
  CONSTRAINT "funding_reservation_state" CHECK ("status" IN ('RESERVED', 'COMMITTED', 'CANCELLED'))
);

CREATE TABLE "fund_allocations" (
  "id" TEXT NOT NULL,
  "allocationNumber" VARCHAR(60) NOT NULL,
  "amountPesewas" INTEGER NOT NULL,
  "recoveredPrincipalPesewas" INTEGER NOT NULL DEFAULT 0,
  "recoveredInterestPesewas" INTEGER NOT NULL DEFAULT 0,
  "status" "FundLotStatus" NOT NULL DEFAULT 'COMMITTED',
  "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "disbursedAt" TIMESTAMP(3),
  "recoveredAt" TIMESTAMP(3),
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "fundLotId" TEXT NOT NULL,
  "loanId" TEXT NOT NULL,
  "reservationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fund_allocations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fund_allocation_amounts" CHECK (
    "amountPesewas" > 0 AND "recoveredPrincipalPesewas" >= 0 AND
    "recoveredInterestPesewas" >= 0 AND "recoveredPrincipalPesewas" <= "amountPesewas"
  ),
  CONSTRAINT "fund_allocation_state" CHECK ("status" IN ('COMMITTED', 'DISBURSED', 'RECOVERED', 'CANCELLED'))
);

CREATE UNIQUE INDEX "fund_accounts_accountNumber_key" ON "fund_accounts"("accountNumber");
CREATE INDEX "fund_accounts_branchId_eligibleForFunding_idx" ON "fund_accounts"("branchId", "eligibleForFunding");
CREATE INDEX "fund_accounts_sourceType_idx" ON "fund_accounts"("sourceType");
CREATE UNIQUE INDEX "fund_lots_lotNumber_key" ON "fund_lots"("lotNumber");
CREATE INDEX "fund_lots_fundAccountId_status_idx" ON "fund_lots"("fundAccountId", "status");
CREATE UNIQUE INDEX "fund_movements_movementNumber_key" ON "fund_movements"("movementNumber");
CREATE UNIQUE INDEX "fund_movements_sourceReference_key" ON "fund_movements"("sourceReference");
CREATE INDEX "fund_movements_fundLotId_occurredAt_idx" ON "fund_movements"("fundLotId", "occurredAt");
CREATE INDEX "fund_movements_actorUserId_occurredAt_idx" ON "fund_movements"("actorUserId", "occurredAt");
CREATE UNIQUE INDEX "funding_reservations_reservationNumber_key" ON "funding_reservations"("reservationNumber");
CREATE INDEX "funding_reservations_fundLotId_status_idx" ON "funding_reservations"("fundLotId", "status");
CREATE INDEX "funding_reservations_loanId_status_idx" ON "funding_reservations"("loanId", "status");
CREATE UNIQUE INDEX "fund_allocations_allocationNumber_key" ON "fund_allocations"("allocationNumber");
CREATE INDEX "fund_allocations_fundLotId_status_idx" ON "fund_allocations"("fundLotId", "status");
CREATE INDEX "fund_allocations_loanId_status_idx" ON "fund_allocations"("loanId", "status");

ALTER TABLE "fund_accounts" ADD CONSTRAINT "fund_accounts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fund_lots" ADD CONSTRAINT "fund_lots_fundAccountId_fkey" FOREIGN KEY ("fundAccountId") REFERENCES "fund_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fund_movements" ADD CONSTRAINT "fund_movements_fundLotId_fkey" FOREIGN KEY ("fundLotId") REFERENCES "fund_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fund_movements" ADD CONSTRAINT "fund_movements_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "funding_reservations" ADD CONSTRAINT "funding_reservations_fundLotId_fkey" FOREIGN KEY ("fundLotId") REFERENCES "fund_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "funding_reservations" ADD CONSTRAINT "funding_reservations_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fund_allocations" ADD CONSTRAINT "fund_allocations_fundLotId_fkey" FOREIGN KEY ("fundLotId") REFERENCES "fund_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fund_allocations" ADD CONSTRAINT "fund_allocations_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fund_allocations" ADD CONSTRAINT "fund_allocations_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "funding_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
