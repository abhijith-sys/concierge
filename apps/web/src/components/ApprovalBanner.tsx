import type { ReactNode } from "react";

export function ApprovalBanner({
  tone,
  title,
  children,
}: {
  tone: "pending" | "rejected" | "suspended";
  title: string;
  children?: ReactNode;
}) {
  const classes =
    tone === "rejected"
      ? "rounded-2xl border border-red-200 bg-red-50 p-4 text-red-950"
      : tone === "suspended"
        ? "rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900"
        : "rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950";
  return (
    <div className={`mt-6 ${classes}`}>
      <p className="font-semibold">{title}</p>
      {children ? <div className="mt-1 text-sm leading-6 opacity-80">{children}</div> : null}
    </div>
  );
}
