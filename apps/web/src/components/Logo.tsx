import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className={twMerge(
        "inline-flex items-center gap-2.5 text-[1.65rem] font-extrabold tracking-[-0.04em] text-navy",
        className,
      )}
    >
      <span className="grid size-7 place-items-center rounded-full bg-gold text-navy shadow-sm">
        <Star className="size-3.5 fill-current" aria-hidden="true" />
      </span>
      Concierge
    </Link>
  );
}
