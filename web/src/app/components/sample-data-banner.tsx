export function SampleDataBanner() {
  return (
    <aside
      aria-label="Sample data environment"
      className="print-controls border-warning/30 bg-warning/10 text-warning border-b px-4 py-2 text-center text-xs font-bold tracking-wider uppercase"
      data-testid="sample-data-banner"
    >
      Sample data - Fictional demonstration records only
    </aside>
  );
}

export function SampleDataBadge() {
  return (
    <span className="border-primary/20 bg-primary/10 text-primary inline-flex rounded-full border px-2.5 py-1 text-xs font-bold tracking-wide uppercase">
      Sample data
    </span>
  );
}
