CREATE TYPE "PaymentMethod" AS ENUM ('CASH');
CREATE TYPE "PaymentSubmissionMode" AS ENUM ('ONLINE');
CREATE TYPE "CustodyMovementType" AS ENUM ('CASH_RECEIVED', 'HANDOVER_POSTED', 'REVERSAL');

ALTER TABLE "receipts" ADD COLUMN "paymentId" TEXT;
ALTER TABLE "repayment_instalments"
  ADD COLUMN "interestPaidPesewas" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "principalPaidPesewas" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "assignments" (
  "id" TEXT NOT NULL,
  "assignmentNumber" VARCHAR(60) NOT NULL,
  "collectionDate" DATE NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
  "targetPesewas" INTEGER NOT NULL,
  "completedAt" TIMESTAMP(3),
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "branchId" TEXT NOT NULL,
  "borrowerId" TEXT NOT NULL,
  "loanId" TEXT NOT NULL,
  "collectorUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "paymentNumber" VARCHAR(60) NOT NULL,
  "idempotencyKey" VARCHAR(100) NOT NULL,
  "amountPesewas" INTEGER NOT NULL,
  "principalAllocatedPesewas" INTEGER NOT NULL,
  "interestAllocatedPesewas" INTEGER NOT NULL,
  "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "submissionMode" "PaymentSubmissionMode" NOT NULL DEFAULT 'ONLINE',
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'CAPTURED',
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "branchId" TEXT NOT NULL,
  "borrowerId" TEXT NOT NULL,
  "loanId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "collectorUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_allocations" (
  "id" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "amountPesewas" INTEGER NOT NULL,
  "principalAllocatedPesewas" INTEGER NOT NULL,
  "interestAllocatedPesewas" INTEGER NOT NULL,
  "paymentId" TEXT NOT NULL,
  "instalmentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "custody_movements" (
  "id" TEXT NOT NULL,
  "movementNumber" VARCHAR(60) NOT NULL,
  "type" "CustodyMovementType" NOT NULL,
  "amountPesewas" INTEGER NOT NULL,
  "balanceAfterPesewas" INTEGER NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "branchId" TEXT NOT NULL,
  "collectorUserId" TEXT NOT NULL,
  "paymentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "custody_movements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assignments_assignmentNumber_key" ON "assignments"("assignmentNumber");
CREATE INDEX "assignments_branchId_collectionDate_idx" ON "assignments"("branchId", "collectionDate");
CREATE INDEX "assignments_collectorUserId_collectionDate_idx" ON "assignments"("collectorUserId", "collectionDate");
CREATE UNIQUE INDEX "assignments_loanId_collectionDate_collectorUserId_key" ON "assignments"("loanId", "collectionDate", "collectorUserId");
CREATE UNIQUE INDEX "payments_paymentNumber_key" ON "payments"("paymentNumber");
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");
CREATE INDEX "payments_branchId_receivedAt_idx" ON "payments"("branchId", "receivedAt");
CREATE INDEX "payments_loanId_receivedAt_idx" ON "payments"("loanId", "receivedAt");
CREATE INDEX "payments_collectorUserId_receivedAt_idx" ON "payments"("collectorUserId", "receivedAt");
CREATE INDEX "payment_allocations_instalmentId_idx" ON "payment_allocations"("instalmentId");
CREATE UNIQUE INDEX "payment_allocations_paymentId_instalmentId_key" ON "payment_allocations"("paymentId", "instalmentId");
CREATE UNIQUE INDEX "custody_movements_movementNumber_key" ON "custody_movements"("movementNumber");
CREATE UNIQUE INDEX "custody_movements_paymentId_key" ON "custody_movements"("paymentId");
CREATE INDEX "custody_movements_collectorUserId_occurredAt_idx" ON "custody_movements"("collectorUserId", "occurredAt");
CREATE INDEX "custody_movements_branchId_occurredAt_idx" ON "custody_movements"("branchId", "occurredAt");
CREATE UNIQUE INDEX "receipts_paymentId_key" ON "receipts"("paymentId");

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_collectorUserId_fkey" FOREIGN KEY ("collectorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_collectorUserId_fkey" FOREIGN KEY ("collectorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_instalmentId_fkey" FOREIGN KEY ("instalmentId") REFERENCES "repayment_instalments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "custody_movements" ADD CONSTRAINT "custody_movements_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "custody_movements" ADD CONSTRAINT "custody_movements_collectorUserId_fkey" FOREIGN KEY ("collectorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "custody_movements" ADD CONSTRAINT "custody_movements_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Give every active sample loan a persisted assignment for today's active
-- field collector in the same branch. Managers supervise these assignments.
INSERT INTO "assignments" (
  "id", "assignmentNumber", "collectionDate", "targetPesewas",
  "isSampleData", "branchId", "borrowerId", "loanId", "collectorUserId", "updatedAt"
)
SELECT
  'asg_' || md5(l."id" || CURRENT_DATE::text),
  'ASN-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || l."loanNumber",
  CURRENT_DATE,
  COALESCE(instalment."totalPesewas", (l."totalRepayablePesewas" / GREATEST(l."termMonths", 1))),
  l."isSampleData",
  l."branchId",
  l."borrowerId",
  l."id",
  collector."userId",
  CURRENT_TIMESTAMP
FROM "loans" l
JOIN LATERAL (
  SELECT sba."userId"
  FROM "staff_branch_assignments" sba
  JOIN "user_roles" ur ON ur."userId" = sba."userId"
  JOIN "roles" r ON r."id" = ur."roleId" AND r."code" = 'FIELD_COLLECTOR'
  JOIN "users" u ON u."id" = sba."userId" AND u."status" = 'ACTIVE'
  WHERE sba."branchId" = l."branchId"
    AND sba."effectiveFrom" <= CURRENT_TIMESTAMP
    AND (sba."effectiveTo" IS NULL OR sba."effectiveTo" > CURRENT_TIMESTAMP)
    AND ur."effectiveFrom" <= CURRENT_TIMESTAMP
    AND (ur."effectiveTo" IS NULL OR ur."effectiveTo" > CURRENT_TIMESTAMP)
  ORDER BY sba."createdAt"
  LIMIT 1
) collector ON true
LEFT JOIN LATERAL (
  SELECT ri."totalPesewas"
  FROM "repayment_instalments" ri
  WHERE ri."loanId" = l."id" AND ri."status" <> 'PAID'
  ORDER BY ri."effectiveCollectionDate", ri."instalmentNumber"
  LIMIT 1
) instalment ON true
WHERE l."status" = 'ACTIVE'
ON CONFLICT ("loanId", "collectionDate", "collectorUserId") DO NOTHING;
