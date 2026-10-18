import { SampleDataBadge } from "./components/sample-data-banner";

export default function Home() {
  return (
    <main className="bg-background text-foreground min-h-screen px-6 py-16">
      <section className="border-border bg-surface mx-auto max-w-4xl overflow-hidden rounded-2xl border shadow-sm">
        <div className="bg-primary px-8 py-10 text-white">
          <p className="text-sm font-semibold tracking-wider uppercase">
            Divya Pravaha
          </p>

          <h1 className="mt-3 text-4xl font-bold">Loan Management System</h1>

          <p className="mt-3 max-w-2xl text-blue-100">
            Group lending, cash collections, capital traceability and
            accountable financial management.
          </p>
        </div>

        <div className="p-8">
          <div className="flex flex-wrap items-center gap-2">
            <SampleDataBadge />
            <span className="bg-success/10 text-success rounded-full px-3 py-1 text-sm font-semibold">
              Initial setup working
            </span>
          </div>

          <h2 className="mt-6 text-2xl font-semibold">Phase 1 prototype</h2>

          <p className="text-muted mt-2 max-w-2xl">
            The application is running with Next.js, TypeScript and the Divya
            Pravaha Tailwind theme.
          </p>

          <button
            type="button"
            className="bg-primary hover:bg-primary-hover mt-8 rounded-lg px-5 py-3 font-semibold text-white transition"
          >
            Open workspace
          </button>
        </div>
      </section>
    </main>
  );
}
