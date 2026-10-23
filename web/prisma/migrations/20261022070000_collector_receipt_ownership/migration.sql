ALTER TABLE "receipts"
ADD COLUMN "idempotencyKey" VARCHAR(100),
ADD COLUMN "collectionNote" VARCHAR(500),
ADD COLUMN "collectorUserId" TEXT;

UPDATE "receipts"
SET "idempotencyKey" = 'SEED-' || "receiptNumber",
    "collectorUserId" = (
      SELECT "id" FROM "users" WHERE "staffNumber" = 'STF-0005' LIMIT 1
    )
WHERE "idempotencyKey" IS NULL OR "collectorUserId" IS NULL;

ALTER TABLE "receipts" ALTER COLUMN "idempotencyKey" SET NOT NULL;
ALTER TABLE "receipts" ALTER COLUMN "collectorUserId" SET NOT NULL;

CREATE UNIQUE INDEX "receipts_idempotencyKey_key" ON "receipts"("idempotencyKey");
CREATE INDEX "receipts_collectorUserId_receivedAt_idx" ON "receipts"("collectorUserId", "receivedAt");

ALTER TABLE "receipts"
ADD CONSTRAINT "receipts_collectorUserId_fkey"
FOREIGN KEY ("collectorUserId") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
