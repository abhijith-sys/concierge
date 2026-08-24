/**
 * Generates apps/web/public/sitemap.xml with static routes plus category slugs from the API.
 *
 * Usage:
 *   VITE_SITE_URL=https://dialgo.in VITE_API_URL=http://localhost:3000 node scripts/generate-sitemap.mjs
 */
const siteUrl = (process.env.VITE_SITE_URL ?? "https://dialgo.in").replace(/\/$/, "");
const apiBase = (process.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const staticPaths = ["/", "/listings", "/about", "/contact", "/terms", "/privacy"];

async function fetchCategorySlugs() {
  try {
    const response = await fetch(`${apiBase}/api/categories`);
    if (!response.ok) return [];
    const categories = await response.json();
    const slugs = [];
    for (const main of categories) {
      slugs.push(main.slug);
      for (const child of main.children ?? []) {
        slugs.push(child.slug);
        for (const nested of child.children ?? []) slugs.push(nested.slug);
      }
    }
    return slugs;
  } catch {
    return [];
  }
}

const categorySlugs = await fetchCategorySlugs();
const paths = [...staticPaths, ...categorySlugs.map((slug) => `/listings/${slug}`)];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (path) =>
      `  <url><loc>${siteUrl}${path}</loc><changefreq>${path === "/" ? "daily" : "weekly"}</changefreq></url>`,
  )
  .join("\n")}
</urlset>
`;

await import("node:fs/promises").then(({ writeFile }) =>
  writeFile(new URL("../public/sitemap.xml", import.meta.url), xml, "utf8"),
);
console.log(`Wrote sitemap with ${paths.length} URLs to public/sitemap.xml`);
