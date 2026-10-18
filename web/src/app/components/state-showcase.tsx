"use client";

import { useState } from "react";
import {
  DeniedState,
  EmptyState,
  ErrorState,
  LoadingState,
  NotFoundState,
} from "./ui/states";

const states = ["loading", "empty", "error", "denied", "not-found"] as const;
type PreviewState = (typeof states)[number];

export function StateShowcase() {
  const [preview, setPreview] = useState<PreviewState>("loading");
  return (
    <div>
      <div
        className="mb-5 flex flex-wrap gap-2"
        aria-label="Select a state to preview"
      >
        {states.map((state) => (
          <button
            key={state}
            type="button"
            onClick={() => setPreview(state)}
            className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${preview === state ? "bg-primary text-white" : "border-border bg-surface border"}`}
          >
            {state.replace("-", " ")}
          </button>
        ))}
      </div>
      {preview === "loading" && <LoadingState label="Loading state preview" />}
      {preview === "empty" && (
        <EmptyState description="No sample records match the current search and filters." />
      )}
      {preview === "error" && (
        <ErrorState onRetry={() => setPreview("loading")} />
      )}
      {preview === "denied" && <DeniedState />}
      {preview === "not-found" && <NotFoundState />}
    </div>
  );
}
