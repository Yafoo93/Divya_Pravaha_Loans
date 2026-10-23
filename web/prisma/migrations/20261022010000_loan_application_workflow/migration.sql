ALTER TABLE "loans"
ADD COLUMN "businessPurpose" VARCHAR(500) NOT NULL DEFAULT 'General business working capital',
ADD COLUMN "submittedByUserId" TEXT;

CREATE TABLE "loan_application_events" (
  "id" TEXT NOT NULL,
  "eventNumber" VARCHAR(60) NOT NULL,
  "eventType" VARCHAR(50) NOT NULL,
  "fromStatus" VARCHAR(30),
  "toStatus" VARCHAR(30) NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "loanId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  CONSTRAINT "loan_application_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loan_application_documents" (
  "id" TEXT NOT NULL,
  "documentNumber" VARCHAR(80) NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "reference" VARCHAR(255) NOT NULL,
  "status" VARCHAR(30) NOT NULL,
  "isPrivate" BOOLEAN NOT NULL DEFAULT true,
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "loanId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "loan_application_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "loan_application_events_eventNumber_key" ON "loan_application_events"("eventNumber");
CREATE INDEX "loan_application_events_loanId_occurredAt_idx" ON "loan_application_events"("loanId", "occurredAt");
CREATE UNIQUE INDEX "loan_application_documents_documentNumber_key" ON "loan_application_documents"("documentNumber");
CREATE INDEX "loan_application_documents_loanId_createdAt_idx" ON "loan_application_documents"("loanId", "createdAt");
ALTER TABLE "loans" ADD CONSTRAINT "loans_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "loan_application_events" ADD CONSTRAINT "loan_application_events_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "loan_application_events" ADD CONSTRAINT "loan_application_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "loan_application_documents" ADD CONSTRAINT "loan_application_documents_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
