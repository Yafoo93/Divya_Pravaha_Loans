import { notFound } from "next/navigation";
import { PageHeading } from "../../components/page-heading";
import { prototypeWorkspace } from "@/lib/workspace-context";
import { workspaceNavigation } from "@/lib/workspace-navigation";
import { Suspense } from "react";
import { WorkspacePermissionBoundary } from "../../components/server-permission-boundary";

export function generateStaticParams() {
  return workspaceNavigation
    .filter((item) => item.href.startsWith("/workspace/"))
    .map((item) => ({
      section: item.href.replace("/workspace/", "").split("/"),
    }));
}

export default async function WorkspaceSectionPage({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  const pathname = `/workspace/${section.join("/")}`;
  const item = workspaceNavigation.find((entry) => entry.href === pathname);

  if (!item) notFound();

  return (
    <Suspense fallback={<div className="p-8">Checking section access...</div>}>
      <WorkspacePermissionBoundary
        path={
          pathname as Parameters<typeof WorkspacePermissionBoundary>[0]["path"]
        }
      >
        <main className="px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <PageHeading
              title={item.label}
              description="This section is ready for its workflow implementation in the corresponding checklist stage."
              branchName={prototypeWorkspace.branch.name}
              date={prototypeWorkspace.displayDate}
              currency={prototypeWorkspace.currency}
            />
          </div>
        </main>
      </WorkspacePermissionBoundary>
    </Suspense>
  );
}
