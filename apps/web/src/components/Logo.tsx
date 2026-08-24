import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { theme } from "../lib/theme";

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  const mark = theme.logoIncludesWordmark ? theme.assets.logo : theme.assets.logoMark;

  return (
    <Link
      to="/"
      onClick={onClick}
      className={twMerge(
        "inline-flex items-center gap-2.5 text-[1.65rem] font-extrabold tracking-[-0.04em] text-navy",
        className,
      )}
    >
      <img
        src={mark}
        alt=""
        className={theme.logoIncludesWordmark ? "h-8 w-auto" : "size-7"}
      />
      {theme.logoIncludesWordmark ? <span className="sr-only">{theme.name}</span> : theme.name}
    </Link>
  );
}
