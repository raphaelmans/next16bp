import type { MetadataRoute } from "next";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatLastModified(value?: string | Date) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export function buildSitemapXml(entries: MetadataRoute.Sitemap) {
  const urls = entries
    .map((entry) => {
      const lastModified = formatLastModified(entry.lastModified);

      return [
        "<url>",
        `<loc>${escapeXml(entry.url)}</loc>`,
        lastModified ? `<lastmod>${lastModified}</lastmod>` : "",
        entry.changeFrequency
          ? `<changefreq>${entry.changeFrequency}</changefreq>`
          : "",
        typeof entry.priority === "number"
          ? `<priority>${entry.priority.toFixed(1)}</priority>`
          : "",
        "</url>",
      ]
        .filter(Boolean)
        .join("");
    })
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
  ].join("");
}
