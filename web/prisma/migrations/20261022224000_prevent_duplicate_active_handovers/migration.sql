-- A receipt may be re-batched after a returned or cancelled handover, but it
-- must never belong to two active handovers at the same time.
CREATE UNIQUE INDEX "handover_receipts_one_active_receipt_key"
ON "handover_receipts" ("receiptId")
WHERE "active" = true;
