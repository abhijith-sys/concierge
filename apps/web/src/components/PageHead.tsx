import { useEffect } from "react";
import { theme } from "../lib/theme";

function upsertMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let meta = document.head.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement("meta");
    if (property) meta.setAttribute("property", name);
    else meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

const JSON_LD_ID = "page-json-ld";

export type DocumentHeadOptions = {
  title: string;
  description: string;
  canonicalPath?: string;
  jsonLd?: Record<string, unknown>;
};

function applyDocumentHead({ title, description, canonicalPath, jsonLd }: DocumentHeadOptions) {
  document.title = title;
  upsertMeta("description", description);
  upsertMeta("og:title", title, true);
  upsertMeta("og:description", description, true);
  upsertMeta("og:type", "website", true);
  upsertMeta("twitter:card", "summary_large_image");
  upsertMeta("twitter:title", title);
  upsertMeta("twitter:description", description);

  const origin = window.location.origin;
  upsertMeta("og:url", canonicalPath ? `${origin}${canonicalPath}` : window.location.href, true);

  if (canonicalPath) {
    upsertCanonical(`${origin}${canonicalPath}`);
  }

  const existing = document.getElementById(JSON_LD_ID);
  if (jsonLd) {
    const script = existing ?? document.createElement("script");
    script.id = JSON_LD_ID;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    if (!existing) document.head.appendChild(script);
  } else if (existing) {
    existing.remove();
  }
}

export function useDocumentHead(options: DocumentHeadOptions) {
  const jsonLdKey = options.jsonLd ? JSON.stringify(options.jsonLd) : "";
  useEffect(() => {
    applyDocumentHead(options);
  }, [options.title, options.description, options.canonicalPath, jsonLdKey]);
}

export function PageHead(options: DocumentHeadOptions) {
  useDocumentHead(options);
  return null;
}

export function defaultPageTitle(suffix?: string) {
  return suffix ? `${suffix} — ${theme.name}` : `${theme.name} — ${theme.tagline}`;
}

export function localBusinessJsonLd(input: {
  name: string;
  slug: string;
  description?: string;
  city?: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  image?: string;
  avgRating?: number;
  reviewCount?: number;
  category?: string;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.name,
    url: `${typeof window !== "undefined" ? window.location.origin : ""}/business/${input.slug}`,
  };
  if (input.description) schema.description = input.description.slice(0, 500);
  if (input.image) schema.image = input.image;
  if (input.phone) schema.telephone = input.phone;
  if (input.website) schema.sameAs = input.website;
  if (input.category) schema.category = input.category;
  if (input.address || input.city) {
    schema.address = {
      "@type": "PostalAddress",
      ...(input.address ? { streetAddress: input.address } : {}),
      ...(input.city ? { addressLocality: input.city } : {}),
    };
  }
  if (typeof input.lat === "number" && typeof input.lng === "number") {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: input.lat,
      longitude: input.lng,
    };
  }
  if (input.reviewCount && input.avgRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: input.avgRating,
      reviewCount: input.reviewCount,
    };
  }
  return schema;
}
