"use client";

import type { ReactNode } from "react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print-controls bg-primary hover:bg-primary-hover rounded-lg px-5 py-3 text-sm font-bold text-white shadow-sm"
    >
      Print / Save as PDF
    </button>
  );
}

export function PrintPage({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="print-controls mx-auto mb-4 flex max-w-4xl justify-end">
        <PrintButton />
      </div>
      {children}
    </main>
  );
}
