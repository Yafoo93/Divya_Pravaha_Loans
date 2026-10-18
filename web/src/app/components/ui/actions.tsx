"use client";

import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";

const buttonStyles = {
  primary: "bg-primary text-white hover:bg-primary-hover border-primary",
  secondary: "bg-surface text-foreground hover:bg-background border-border",
  danger: "bg-danger text-white hover:opacity-90 border-danger",
  ghost: "bg-transparent text-primary hover:bg-primary/10 border-transparent",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonStyles;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`focus-visible:ring-primary/25 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition focus-visible:ring-4 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
    >
      {loading && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      )}
      {loading ? "Working..." : children}
    </button>
  );
}

export type MenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export function Menu({
  label,
  items,
}: {
  label: string;
  items: readonly MenuItem[];
}) {
  return (
    <details className="relative inline-block">
      <summary className="border-border bg-surface hover:bg-background flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold [&::-webkit-details-marker]:hidden">
        {label}
        <span className="text-muted" aria-hidden="true">
          v
        </span>
      </summary>
      <div
        role="menu"
        className="border-border bg-surface absolute top-12 right-0 z-30 min-w-52 rounded-xl border p-1.5 shadow-xl"
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={item.onSelect}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${item.danger ? "text-danger hover:bg-danger/10" : "hover:bg-background"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </details>
  );
}

export function Dialog({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;
  const titleId = "prototype-dialog-title";
  const descriptionId = "prototype-dialog-description";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="border-border bg-surface w-full max-w-lg rounded-2xl border p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl font-bold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-muted mt-2 text-sm">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="text-muted hover:bg-background flex size-9 items-center justify-center rounded-full text-xl"
          >
            x
          </button>
        </div>
        {children && <div className="mt-6">{children}</div>}
      </section>
    </div>
  );
}

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} title={title} description={message} onClose={onCancel}>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant={destructive ? "danger" : "primary"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

const alertStyles = {
  info: "border-primary/25 bg-primary/10 text-primary",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
} as const;

export function Alert({
  title,
  children,
  variant = "info",
  onDismiss,
}: {
  title: string;
  children?: ReactNode;
  variant?: keyof typeof alertStyles;
  onDismiss?: () => void;
}) {
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${alertStyles[variant]}`}
    >
      <div>
        <p className="font-bold">{title}</p>
        {children && <div className="mt-1 text-sm opacity-90">{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label={`Dismiss ${title}`}
          onClick={onDismiss}
          className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
        >
          x
        </button>
      )}
    </div>
  );
}
