import Link from "next/link";
import type { ReactNode } from "react";

type StatePanelProps = {
  eyebrow?: string;
  title: string;
  description: string;
  icon: string;
  actions?: ReactNode;
};

function StatePanel({
  eyebrow,
  title,
  description,
  icon,
  actions,
}: StatePanelProps) {
  return (
    <section className="border-border bg-surface flex min-h-80 flex-col items-center justify-center rounded-2xl border p-8 text-center shadow-sm">
      <div
        className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full text-xl font-black"
        aria-hidden="true"
      >
        {icon}
      </div>
      {eyebrow && (
        <p className="text-primary mt-5 text-xs font-bold tracking-wider uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-2xl font-bold">{title}</h2>
      <p className="text-muted mt-2 max-w-md text-sm">{description}</p>
      {actions && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {actions}
        </div>
      )}
    </section>
  );
}

export function LoadingState({
  label = "Loading workspace data",
}: {
  label?: string;
}) {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
      className="space-y-4 p-6"
    >
      <span className="sr-only">{label}</span>
      <div className="bg-border h-5 w-40 animate-pulse rounded" />
      <div className="bg-border h-10 w-72 max-w-full animate-pulse rounded" />
      <div className="grid gap-4 pt-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="border-border bg-surface h-32 animate-pulse rounded-xl border"
          >
            <div className="bg-border m-5 h-4 w-24 rounded" />
            <div className="bg-border m-5 h-8 w-20 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function EmptyState({
  title = "No records found",
  description = "There is no data to display for the current selection.",
  actions,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <StatePanel
      icon="0"
      eyebrow="Empty"
      title={title}
      description={description}
      actions={actions}
    />
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "The page could not be loaded. Try the action again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <StatePanel
      icon="!"
      eyebrow="Error"
      title={title}
      description={description}
      actions={
        onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="bg-primary hover:bg-primary-hover rounded-lg px-4 py-2 text-sm font-bold text-white"
          >
            Try again
          </button>
        )
      }
    />
  );
}

export function DeniedState() {
  return (
    <StatePanel
      icon="X"
      eyebrow="Access denied"
      title="You do not have permission"
      description="Your current role cannot view this page or perform this action."
      actions={
        <Link
          href="/workspace"
          className="bg-primary hover:bg-primary-hover rounded-lg px-4 py-2 text-sm font-bold text-white"
        >
          Return to workspace
        </Link>
      }
    />
  );
}

export function NotFoundState() {
  return (
    <StatePanel
      icon="?"
      eyebrow="404"
      title="Page not found"
      description="The requested page does not exist or may have moved."
      actions={
        <Link
          href="/workspace"
          className="bg-primary hover:bg-primary-hover rounded-lg px-4 py-2 text-sm font-bold text-white"
        >
          Return to workspace
        </Link>
      }
    />
  );
}
