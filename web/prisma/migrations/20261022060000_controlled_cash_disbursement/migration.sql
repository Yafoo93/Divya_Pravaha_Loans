CREATE TABLE "disbursements" (
  "id" TEXT NOT NULL,
  "disbursementNumber" VARCHAR(60) NOT NULL,
  "idempotencyKey" VARCHAR(100) NOT NULL,
  "amountPesewas" INTEGER NOT NULL,
  "beneficiaryName" VARCHAR(150) NOT NULL,
  "beneficiaryIdentity" VARCHAR(30) NOT NULL,
  "identityConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "contractReference" VARCHAR(120) NOT NULL,
  "managerAuthorization" VARCHAR(120) NOT NULL,
  "actualCashOutAt" TIMESTAMP(3) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'POSTED',
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "loanId" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "journalId" TEXT NOT NULL,
  "preparedByUserId" TEXT NOT NULL,
  "authorizedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "disbursements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "disbursement_positive_amount" CHECK ("amountPesewas" > 0),
  CONSTRAINT "disbursement_identity_confirmed" CHECK ("identityConfirmed" = true)
);

CREATE TABLE "cash_vouchers" (
  "id" TEXT NOT NULL,
  "voucherNumber" VARCHAR(60) NOT NULL,
  "documentReference" VARCHAR(255) NOT NULL,
  "signedAt" TIMESTAMP(3) NOT NULL,
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "disbursementId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cash_vouchers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "repayment_instalments" (
  "id" TEXT NOT NULL,
  "instalmentNumber" INTEGER NOT NULL,
  "principalPesewas" INTEGER NOT NULL,
  "interestPesewas" INTEGER NOT NULL,
  "totalPesewas" INTEGER NOT NULL,
  "contractualDueDate" TIMESTAMP(3) NOT NULL,
  "effectiveCollectionDate" TIMESTAMP(3) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'AWAITING',
  "loanId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "repayment_instalments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "repayment_instalment_amounts" CHECK (
    "principalPesewas" > 0 AND "interestPesewas" >= 0 AND
    "totalPesewas" = "principalPesewas" + "interestPesewas"
  )
);

CREATE UNIQUE INDEX "disbursements_disbursementNumber_key" ON "disbursements"("disbursementNumber");
CREATE UNIQUE INDEX "disbursements_idempotencyKey_key" ON "disbursements"("idempotencyKey");
CREATE UNIQUE INDEX "disbursements_loanId_key" ON "disbursements"("loanId");
CREATE UNIQUE INDEX "disbursements_reservationId_key" ON "disbursements"("reservationId");
CREATE UNIQUE INDEX "disbursements_journalId_key" ON "disbursements"("journalId");
CREATE INDEX "disbursements_actualCashOutAt_idx" ON "disbursements"("actualCashOutAt");
CREATE UNIQUE INDEX "cash_vouchers_voucherNumber_key" ON "cash_vouchers"("voucherNumber");
CREATE UNIQUE INDEX "cash_vouchers_disbursementId_key" ON "cash_vouchers"("disbursementId");
CREATE UNIQUE INDEX "repayment_instalments_loanId_instalmentNumber_key" ON "repayment_instalments"("loanId", "instalmentNumber");
CREATE INDEX "repayment_instalments_effectiveCollectionDate_status_idx" ON "repayment_instalments"("effectiveCollectionDate", "status");

ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "funding_reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_preparedByUserId_fkey" FOREIGN KEY ("preparedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_authorizedByUserId_fkey" FOREIGN KEY ("authorizedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_vouchers" ADD CONSTRAINT "cash_vouchers_disbursementId_fkey" FOREIGN KEY ("disbursementId") REFERENCES "disbursements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "repayment_instalments" ADD CONSTRAINT "repayment_instalments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
