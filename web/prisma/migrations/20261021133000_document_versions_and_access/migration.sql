ALTER TABLE "documents" ADD COLUMN "currentVersion" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "document_versions" (
  "id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "storageReference" VARCHAR(255) NOT NULL,
  "fileName" VARCHAR(255),
  "checksum" VARCHAR(128),
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "documentId" TEXT NOT NULL,
  "uploadedByUserId" TEXT,
  CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_access_events" (
  "id" TEXT NOT NULL,
  "action" VARCHAR(30) NOT NULL,
  "outcome" VARCHAR(16) NOT NULL,
  "reason" VARCHAR(120),
  "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "documentId" TEXT NOT NULL,
  "versionId" TEXT,
  "accessedByUserId" TEXT NOT NULL,
  CONSTRAINT "document_access_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_versions_documentId_version_key" ON "document_versions"("documentId", "version");
CREATE INDEX "document_versions_uploadedAt_idx" ON "document_versions"("uploadedAt");
CREATE INDEX "document_access_events_documentId_accessedAt_idx" ON "document_access_events"("documentId", "accessedAt");
CREATE INDEX "document_access_events_accessedByUserId_accessedAt_idx" ON "document_access_events"("accessedByUserId", "accessedAt");

ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "document_access_events" ADD CONSTRAINT "document_access_events_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_access_events" ADD CONSTRAINT "document_access_events_accessedByUserId_fkey" FOREIGN KEY ("accessedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "document_versions" ("id", "version", "storageReference", "fileName", "uploadedAt", "documentId", "uploadedByUserId")
SELECT md5(random()::text || "id"), 1, "storageReference", "fileName", "uploadedAt", "id", "uploadedByUserId"
FROM "documents";
