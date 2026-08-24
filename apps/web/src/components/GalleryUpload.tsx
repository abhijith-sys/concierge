import { ImagePlus, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { SafeImage } from "./SafeImage";

export const MAX_GALLERY_IMAGES = 20;

export function GalleryUpload({
  label,
  values,
  uploading = false,
  max = MAX_GALLERY_IMAGES,
  className,
  hint,
  onSelect,
  onRemove,
}: {
  label: string;
  values: string[];
  uploading?: boolean;
  max?: number;
  className?: string;
  hint?: string;
  onSelect: (files: File[]) => void;
  onRemove: (url: string) => void;
}) {
  const remaining = Math.max(0, max - values.length);
  const canAdd = remaining > 0 && !uploading;

  return (
    <div className={twMerge("grid gap-2 text-sm font-semibold md:col-span-2", className)}>
      <span>
        {label}
        <span className="ml-2 text-xs font-normal text-ink-soft">
          {values.length}/{max}
        </span>
      </span>
      {hint ? <p className="text-xs font-normal text-ink-soft">{hint}</p> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {values.map((url, index) => (
          <div key={`${url}-${index}`} className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-line">
            <SafeImage src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/70 text-white"
              onClick={() => onRemove(url)}
              aria-label="Remove image"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        {canAdd ? (
          <label className="relative grid aspect-[5/4] cursor-pointer place-items-center rounded-2xl border border-dashed border-line bg-surface-low text-ink-soft">
            <span className="grid justify-items-center gap-1 px-2 text-center text-xs font-medium">
              <ImagePlus className="size-6" />
              {uploading ? "Uploading…" : "Add photos"}
              <span className="font-normal text-ink-soft/80">Select multiple</span>
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/*"
              multiple
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => {
                const files = [...(event.target.files ?? [])].slice(0, remaining);
                if (files.length) onSelect(files);
                event.currentTarget.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
