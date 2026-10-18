import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type FieldShellProps = {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
};

function FieldShell({
  id,
  label,
  required,
  help,
  error,
  children,
}: FieldShellProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-foreground mb-1.5 block text-sm font-bold"
      >
        {label}
        {required && (
          <span className="text-danger ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {(help || error) && (
        <p
          id={`${id}-description`}
          className={`mt-1.5 text-xs ${error ? "text-danger font-semibold" : "text-muted"}`}
        >
          {error ?? help}
        </p>
      )}
    </div>
  );
}

const controlClass =
  "border-border bg-surface text-foreground placeholder:text-muted/70 focus:border-primary focus:ring-primary/20 min-h-11 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-muted disabled:opacity-75";

type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  help?: string;
  error?: string;
};
export function InputField({
  id,
  label,
  help,
  error,
  required,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      help={help}
      error={error}
      required={required}
    >
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={help || error ? `${id}-description` : undefined}
        className={`${controlClass} ${error ? "border-danger focus:border-danger focus:ring-danger/15" : ""} ${className}`}
      />
    </FieldShell>
  );
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  id: string;
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
};
export function SelectField({
  id,
  label,
  help,
  error,
  required,
  children,
  className = "",
  ...props
}: SelectFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      help={help}
      error={error}
      required={required}
    >
      <select
        {...props}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={help || error ? `${id}-description` : undefined}
        className={`${controlClass} ${error ? "border-danger focus:border-danger focus:ring-danger/15" : ""} ${className}`}
      >
        {children}
      </select>
    </FieldShell>
  );
}

type TextareaFieldProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> & { id: string; label: string; help?: string; error?: string };
export function TextareaField({
  id,
  label,
  help,
  error,
  required,
  className = "",
  ...props
}: TextareaFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      help={help}
      error={error}
      required={required}
    >
      <textarea
        {...props}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={help || error ? `${id}-description` : undefined}
        className={`${controlClass} min-h-28 resize-y ${error ? "border-danger focus:border-danger focus:ring-danger/15" : ""} ${className}`}
      />
    </FieldShell>
  );
}

type CheckboxFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> & { id: string; label: string; help?: string; error?: string };
export function CheckboxField({
  id,
  label,
  help,
  error,
  required,
  ...props
}: CheckboxFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          {...props}
          id={id}
          type="checkbox"
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={help || error ? `${id}-description` : undefined}
          className="border-border text-primary focus:ring-primary/25 mt-0.5 size-5 rounded border disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="text-sm font-semibold">
          {label}
          {required && (
            <span className="text-danger ml-1" aria-hidden="true">
              *
            </span>
          )}
        </span>
      </label>
      {(help || error) && (
        <p
          id={`${id}-description`}
          className={`mt-1.5 pl-8 text-xs ${error ? "text-danger font-semibold" : "text-muted"}`}
        >
          {error ?? help}
        </p>
      )}
    </div>
  );
}
