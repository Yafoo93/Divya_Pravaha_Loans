import { PageHeading } from "../../components/page-heading";
import { SampleForm } from "../../components/sample-form";
import { prototypeWorkspace } from "@/lib/workspace-context";

export default function InterfaceFormsPage() {
  return (
    <main className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <PageHeading
          title="Form controls"
          description="Prototype controls with clear labels, help, validation, and disabled states."
          branchName={prototypeWorkspace.branch.name}
          date={prototypeWorkspace.displayDate}
          currency={prototypeWorkspace.currency}
        />
        <div className="mt-8">
          <SampleForm />
        </div>
      </div>
    </main>
  );
}
