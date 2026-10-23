-- CreateTable
CREATE TABLE "period_reopening_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" VARCHAR(60) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" "ControlRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decisionReason" VARCHAR(500),
    "periodId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "decidedByUserId" TEXT,

    CONSTRAINT "period_reopening_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "period_reopening_requests_requestNumber_key" ON "period_reopening_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "period_reopening_requests_branchId_status_requestedAt_idx" ON "period_reopening_requests"("branchId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "period_reopening_requests_periodId_status_idx" ON "period_reopening_requests"("periodId", "status");

-- AddForeignKey
ALTER TABLE "period_reopening_requests" ADD CONSTRAINT "period_reopening_requests_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "accounting_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_reopening_requests" ADD CONSTRAINT "period_reopening_requests_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_reopening_requests" ADD CONSTRAINT "period_reopening_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_reopening_requests" ADD CONSTRAINT "period_reopening_requests_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
