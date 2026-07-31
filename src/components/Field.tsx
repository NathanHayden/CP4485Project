import type { ReactNode } from "react";

export const fieldInputClass =
  "mt-1 w-full rounded-lg border border-line-strong bg-surface-muted px-3 py-2 text-sm text-ink outline-none focus:border-nl-green";

type FieldProps = {
  label: string;
  name?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  min?: string;
  children?: ReactNode;
};

export default function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  defaultValue,
  min,
  children,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {children ? (
        children
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          min={min}
          className={fieldInputClass}
        />
      )}
    </label>
  );
}
