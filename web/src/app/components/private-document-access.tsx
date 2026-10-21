"use client";

import { useState } from "react";
import { formatAccraDateTime } from "@/lib/formatters";

type DocumentMetadata = {
  documentNumber: string;
  currentVersion: number;
  versions: { version: number; uploadedAt: string; fileName: string | null }[];
};

export function PrivateDocumentAccess({ documentId }: { documentId: string }) {
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function viewRecord() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/documents/${encodeURIComponent(documentId)}`,
      );
      const result = (await response.json()) as DocumentMetadata & {
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Access failed.");
      setMetadata(result);
    } catch (accessError) {
      setError(
        accessError instanceof Error ? accessError.message : "Access failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={viewRecord}
        disabled={busy}
        className="border-border bg-surface text-primary min-h-10 rounded-lg border px-3 text-xs font-bold disabled:opacity-50"
      >
        {busy ? "Opening..." : "View version record"}
      </button>
      {error && (
        <p role="alert" className="text-danger mt-2 text-xs">
          {error}
        </p>
      )}
      {metadata && (
        <div className="border-border bg-background mt-2 rounded-lg border p-3 text-xs">
          <p className="font-bold">
            Current version: v{metadata.currentVersion}
          </p>
          {metadata.versions.map((version) => (
            <p key={version.version} className="text-muted mt-1">
              v{version.version} · {formatAccraDateTime(version.uploadedAt)}
              {version.fileName ? ` · ${version.fileName}` : ""}
            </p>
          ))}
          <p className="text-muted mt-2">
            This authorized access has been recorded.
          </p>
        </div>
      )}
    </div>
  );
}
