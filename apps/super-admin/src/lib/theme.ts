import { useEffect, useState } from "react";

type Brand = {
  name: string;
};

const fallback: Brand = { name: "DialGo" };
let cached: Brand | null = null;
let pending: Promise<Brand> | null = null;

function loadBrand() {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;
  pending = fetch("/theme/theme.json")
    .then((response) => (response.ok ? response.json() : fallback))
    .then((data: { name?: string }) => {
      const name = typeof data?.name === "string" ? data.name.trim() : "";
      cached = name ? { name } : fallback;
      return cached;
    })
    .catch(() => {
      cached = fallback;
      return cached;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

export function useBrand() {
  const [brand, setBrand] = useState<Brand>(cached ?? fallback);

  useEffect(() => {
    let cancelled = false;
    void loadBrand().then((next) => {
      if (cancelled) return;
      setBrand(next);
      document.title = `${next.name} Super Admin`;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return brand;
}
