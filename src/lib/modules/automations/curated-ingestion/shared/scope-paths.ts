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
    runStatePath: path.join(baseDir, "run-state.json"),
    runReportPath: path.join(baseDir, "run-report.json"),
    scrapeStatePath: path.join(baseDir, "scrape-state.json"),
    scrapeOutputPath: path.join(baseDir, "curated-courts.csv"),
    scrapeRawOutputPath: path.join(baseDir, "curated-courts.raw.json"),
    scrapeCoverageOutputPath: path.join(baseDir, "coverage.json"),
    approvedOutputPath: path.join(baseDir, "curated-courts.approved.csv"),
    duplicateOutputPath: path.join(baseDir, "curated-courts.duplicates.csv"),
    reviewOutputPath: path.join(baseDir, "curated-courts.review.csv"),
    dedupeReportPath: path.join(baseDir, "curated-courts.dedupe-report.json"),
    importQueueDir: path.join(baseDir, "import-queue"),
  };
}

export function buildCuratedFacebookScopePaths(input: {
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
    "discovery-facebook",
    sportSlug,
    provinceSlug,
    citySlug,
  );

  return {
    baseDir,
    urlsPath: path.join(baseDir, "facebook-pages.urls.txt"),
    statePath: path.join(baseDir, "facebook-pages.state.json"),
    reportPath: path.join(baseDir, "facebook-pages.report.json"),
    runStatePath: path.join(baseDir, "facebook-run-state.json"),
    runReportPath: path.join(baseDir, "facebook-run-report.json"),
    captureStatePath: path.join(baseDir, "facebook-pages.capture-state.json"),
    captureOutputPath: path.join(baseDir, "facebook-pages.captured.json"),
    captureReportPath: path.join(baseDir, "facebook-pages.capture-report.json"),
    csvOutputPath: path.join(baseDir, "facebook-pages-curated-courts.csv"),
    approvedOutputPath: path.join(
      baseDir,
      "facebook-pages-curated-courts.approved.csv",
    ),
    duplicateOutputPath: path.join(
      baseDir,
      "facebook-pages-curated-courts.duplicates.csv",
    ),
    reviewOutputPath: path.join(
      baseDir,
      "facebook-pages-curated-courts.review.csv",
    ),
    dedupeReportPath: path.join(
      baseDir,
      "facebook-pages-curated-courts.dedupe-report.json",
    ),
    importQueueDir: path.join(baseDir, "facebook-import-queue"),
  };
}
