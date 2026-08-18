import { useEffect, useState } from "react";
import { Lottie } from "lottie-react";
import { theme } from "../lib/theme";

export function ThemeBackdrop({ className }: { className?: string }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <Lottie
      src={theme.assets.backdrop}
      loop={!reduceMotion}
      autoplay={!reduceMotion}
      aria-hidden
      rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
      className={className}
    />
  );
}
