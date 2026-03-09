import path from "node:path";
import { normalizeLocationSlug } from "./url-normalization";

export function buildCuratedDiscoveryScopePaths(input: {
  city: string;
  province: string;
  sportSlug: string;
}) {
  const sportSlug = normalizeLocationSlug(input.sportSlug);
  const provinceSlug = normalizeLocationSlug(input.province);
  const citySlug = normalizeLocationSlug(input.city);

  const baseDir = path.join(
    "scripts",
    "output",
    "discovery",
    sportSlug,
    provinceSlug,
    citySlug,
  );

  return {
    baseDir,
    urlsPath: path.join(baseDir, "leads.urls.txt"),
    statePath: path.join(baseDir, "leads.state.json"),
    reportPath: path.join(baseDir, "leads.report.json"),
    scrapeStatePath: path.join(baseDir, "scrape-state.json"),
    scrapeOutputPath: path.join(baseDir, "curated-courts.csv"),
    scrapeRawOutputPath: path.join(baseDir, "curated-courts.raw.json"),
    scrapeCoverageOutputPath: path.join(baseDir, "coverage.json"),
  };
}
