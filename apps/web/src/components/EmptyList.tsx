import { Lottie } from "lottie-react";
import { useEffect, useState, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { theme } from "../lib/theme";

export function EmptyList({
  title,
  description,
  action,
  compact = false,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      className={twMerge(
        "mx-auto flex w-full flex-col items-center justify-center text-center",
        compact ? "max-w-sm px-4 py-8" : "min-h-80 max-w-lg px-6 py-10",
        className,
      )}
    >
      <Lottie
        src={theme.assets.emptyList}
        loop={!reduceMotion}
        autoplay={!reduceMotion}
        aria-hidden
        className={compact ? "h-24 w-60" : "h-36 w-[22rem] max-w-full"}
      />
      <p className={twMerge("font-bold text-navy", compact ? "mt-4 text-lg" : "mt-5 text-2xl")}>{title}</p>
      {description ? <p className="mt-2 text-sm text-ink-soft">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
