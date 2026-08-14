import { LoaderCircle, SearchX } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { twMerge } from "tailwind-merge";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "gold" | "ghost";
}) {
  return (
    <button
      className={twMerge(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]",
        variant === "primary" && "bg-navy text-white hover:bg-[#0e1422]",
        variant === "outline" && "border border-navy bg-transparent text-navy hover:bg-navy hover:text-white",
        variant === "gold" && "bg-gold text-navy hover:bg-[#b8893f]",
        variant === "ghost" && "bg-transparent text-ink-soft hover:bg-surface-high hover:text-navy",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={twMerge(
        "min-h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-black focus:ring-2 focus:ring-black/10",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={twMerge(
        "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-black focus:ring-2 focus:ring-black/10",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={twMerge(
        "min-h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      {children}
      {error ? <span className="text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  );
}

export function PageState({
  title,
  description,
  loading = false,
  action,
}: {
  title: string;
  description?: string;
  loading?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-80 max-w-lg flex-col items-center justify-center px-6 text-center">
      {loading ? (
        <LoaderCircle className="mb-5 size-8 animate-spin" aria-hidden="true" />
      ) : (
        <SearchX className="mb-5 size-9 text-gold" aria-hidden="true" />
      )}
      <h1 className="text-2xl font-bold">{title}</h1>
      {description ? <p className="mt-2 text-sm text-ink-soft">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
