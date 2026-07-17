import { useState, type ImgHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23eae7e9'/%3E%3Cpath d='M0 650 330 360l190 170 170-210 510 330v150H0z' fill='%23d5d1d4'/%3E%3Ccircle cx='900' cy='220' r='75' fill='%23fed08c'/%3E%3C/svg%3E";

export function SafeImage({
  className,
  loading = "lazy",
  src,
  alt,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);

  return (
    <img
      {...props}
      src={failed || !src ? FALLBACK_IMAGE : src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={twMerge("bg-surface-high", className)}
      onError={() => setFailed(true)}
    />
  );
}
