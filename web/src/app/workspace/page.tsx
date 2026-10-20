import { PageHeading } from "../components/page-heading";
import { SamplePortfolioTable } from "../components/sample-portfolio-table";
import { SampleActions } from "../components/sample-actions";
import { Card } from "../components/ui/data-display";
import { prototypeWorkspace } from "@/lib/workspace-context";
import { Suspense } from "react";
import { WorkspacePermissionBoundary } from "../components/server-permission-boundary";

export default function WorkspaceOverviewPage() {
  return (
    <Suspense
      fallback={<div className="p-8">Loading authorized workspace...</div>}
    >
      <WorkspacePermissionBoundary path="/workspace">
        <main className="px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <PageHeading
              title="Manager overview"
              description="Your branch portfolio, cash position, and decisions requiring attention."
              branchName={prototypeWorkspace.branch.name}
              date={prototypeWorkspace.displayDate}
              currency={prototypeWorkspace.currency}
            />

            <section
              className="mt-8 grid gap-4 md:grid-cols-3"
              aria-label="Workspace summary"
            >
              {["Active borrowers", "Active loans", "Pending decisions"].map(
                (label, index) => (
                  <Card key={label} className="p-5">
                    <p className="text-muted text-sm">{label}</p>
                    <p className="mt-2 text-3xl font-bold">
                      {[6, 2, 1][index]}
                    </p>
                  </Card>
                ),
              )}
            </section>
            <SamplePortfolioTable />
            <SampleActions />
          </div>
        </main>
      </WorkspacePermissionBoundary>
    </Suspense>
  );
}
