import { useEffect } from "react";
import { theme } from "../lib/theme";

function upsertLink(rel: string, href: string, attrs: Record<string, string> = {}) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
  for (const [key, value] of Object.entries(attrs)) {
    link.setAttribute(key, value);
  }
}

export function BrandHead() {
  useEffect(() => {
    document.title = `${theme.name} — ${theme.tagline}`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", theme.description);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.themeColor);
    upsertLink("icon", theme.assets.favicon, { type: "image/svg+xml" });
    upsertLink("apple-touch-icon", theme.assets.logoMark);
  }, []);

  return null;
}
