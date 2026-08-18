import { Lottie } from "lottie-react";
import { useEffect, useState } from "react";

export function EmptyList({
  title,
  description,
  compact = false,
}: {
  title: string;
  description?: string;
  compact?: boolean;
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
    <div className={compact ? "empty-list compact" : "empty-list"}>
      <Lottie
        src="/theme/animated/empty-list.json"
        loop={!reduceMotion}
        autoplay={!reduceMotion}
        aria-hidden
        className="empty-list-anim"
      />
      <p className="empty-list-title">{title}</p>
      {description ? <p className="muted">{description}</p> : null}
    </div>
  );
}
