import type { InputHTMLAttributes, ReactNode } from "react";

const DASAR =
  "mt-1 block w-full rounded-md border-0 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-sky-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700";

export const inputClass = DASAR;

export function Field({
  label,
  name,
  error,
  hint,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string; hint?: string }) {
  const id = `field-${name}`;
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${DASAR} ${error ? "ring-red-600" : ""}`}
        {...input}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-zinc-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  name,
  children,
  error,
  ...select
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; error?: string; children: ReactNode }) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${DASAR} ${error ? "ring-red-600" : ""}`}
        {...select}
      >
        {children}
      </select>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
