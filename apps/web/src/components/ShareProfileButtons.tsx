import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ShareProfileButtons({ name, slug }: { name: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/business/${slug}`;
  const shareText = `Check out ${name} on ${window.location.hostname}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  function shareWhatsApp() {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void copyLink()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-2 text-xs font-bold text-black backdrop-blur"
        aria-label="Copy profile link"
      >
        {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={shareWhatsApp}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/80 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur"
        aria-label="Share on WhatsApp"
      >
        <Share2 className="size-3.5" />
        WhatsApp
      </button>
    </div>
  );
}
