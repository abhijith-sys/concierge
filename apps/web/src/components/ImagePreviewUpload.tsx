import { ImagePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

export function ImagePreviewUpload({
  label,
  value,
  aspect = "square",
  uploading = false,
  className,
  onSelect,
}: {
  label: string;
  value?: string | null;
  aspect?: "square" | "banner";
  uploading?: boolean;
  className?: string;
  onSelect: (file: File) => void;
}) {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const shown = localUrl || value || "";

  useEffect(() => {
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [localUrl]);

  return (
    <label className={twMerge("grid gap-2 text-sm font-semibold", className)}>
      {label}
      <span
        className={twMerge(
          "relative block overflow-hidden rounded-2xl border border-dashed border-line bg-surface-low",
          aspect === "banner" ? "aspect-[16/7]" : "aspect-square max-w-40",
        )}
      >
        {shown ? (
          <img src={shown} alt="" className="size-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-ink-soft">
            <span className="grid justify-items-center gap-1 text-center text-xs font-medium">
              <ImagePlus className="size-6" />
              Choose image
            </span>
          </span>
        )}
        {uploading ? (
          <span className="absolute inset-0 grid place-items-center bg-white/70 text-xs font-bold text-navy">
            Uploading…
          </span>
        ) : null}
      </span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        className="block w-full text-xs font-normal"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setLocalUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return URL.createObjectURL(file);
          });
          onSelect(file);
        }}
      />
    </label>
  );
}
