"use client";

import { ErrorState } from "../components/ui/states";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="p-6 lg:p-10">
      <ErrorState
        description={
          error.digest
            ? `The request failed. Reference: ${error.digest}`
            : "The workspace could not be loaded. Try the action again."
        }
        onRetry={reset}
      />
    </main>
  );
}
