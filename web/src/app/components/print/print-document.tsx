import type { ReactNode } from "react";

export function PrintDocument({
  title,
  reference,
  date,
  children,
  compact = false,
}: {
  title: string;
  reference: string;
  date: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <article
      className={`print-document border-border bg-surface relative mx-auto overflow-hidden border shadow-sm ${compact ? "max-w-xl" : "max-w-4xl"}`}
    >
      <div
        className="print-watermark pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="text-danger/5 -rotate-35 text-7xl font-black tracking-widest">
          SAMPLE
        </span>
      </div>
      <header className="border-border relative flex items-start justify-between gap-6 border-b p-6">
        <div>
          <p className="text-success text-sm font-black tracking-wider">
            DIVYA PRAVAHA
          </p>
          <p className="text-muted text-xs uppercase">
            Trading and Financial Services
          </p>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted mt-1 text-xs">{reference}</p>
          <p className="text-muted text-xs">{date}</p>
        </div>
      </header>
      <div className="relative p-6">{children}</div>
      <footer className="border-border text-muted relative flex justify-between gap-4 border-t px-6 py-4 text-[10px]">
        <span>Kasoa Market · Ghana · Currency: GHS</span>
        <strong className="text-danger uppercase">
          Sample data — not a valid financial document
        </strong>
      </footer>
    </article>
  );
}

export function DocumentField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-muted text-xs font-bold uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}

export function DocumentTable({
  headings,
  rows,
  total,
}: {
  headings: readonly string[];
  rows: readonly ReactNode[][];
  total?: ReactNode[];
}) {
  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-background">
          <tr>
            {headings.map((heading, index) => (
              <th
                key={`${heading}-${index}`}
                className={`px-3 py-2 text-xs font-bold uppercase ${index > 0 ? "text-right" : "text-left"}`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={`px-3 py-2 ${index > 0 ? "text-right tabular-nums" : "text-left"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {total && (
          <tfoot className="border-border bg-background border-t font-bold">
            <tr>
              {total.map((cell, index) => (
                <td
                  key={index}
                  className={`px-3 py-2 ${index > 0 ? "text-right tabular-nums" : "text-left"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export function SignatureLine({ label }: { label: string }) {
  return (
    <div className="pt-12">
      <div className="border-foreground border-t" />
      <p className="text-muted mt-2 text-xs">{label}</p>
    </div>
  );
}
