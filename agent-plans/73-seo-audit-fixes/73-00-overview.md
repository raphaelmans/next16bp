# SEO Audit Fixes - Master Plan

## Overview

Address critical SEO issues identified in the January 26, 2026 audit of kudoscourts.com public pages.

### Audit Source

- Date: 2026-01-26
- Auditor: Kookie (AI agent)
- Scope: Public pages (homepage, courts listing, venue detail, location pages)

### Reference Documents

| Document | Location |
|----------|----------|
| Design System | `business-contexts/kudoscourts-design-system.md` |
| PRD | `business-contexts/kudoscourts-prd-v1.2.md` |
| Sitemap | `https://kudoscourts.com/sitemap.xml` |

---

## Critical Issues

| Priority | Issue | Impact | Module |
|----------|-------|--------|--------|
| 🔴 P0 | Venue page canonical URLs show `/venues/undefined` | Broken indexing | 73-01 |
| 🔴 P0 | Venue page meta tags are generic (not venue-specific) | Poor SERP appearance | 73-01 |
| 🟡 P1 | Sitemap uses non-www URLs but site redirects to www | Crawl budget waste | 73-02 |
| 🟡 P1 | Venue pages missing from sitemap | Pages not discovered | 73-02 |
| 🟢 P2 | Missing OG images for venue pages | Poor social sharing | 73-03 |
| 🟢 P2 | Missing LocalBusiness schema for verified venues | Rich results opportunity | 73-03 |

---

## Development Phases

| Phase | Description | Module | Parallelizable |
|-------|-------------|--------|----------------|
| 1 | Fix venue page metadata (canonical, title, description, OG) | 73-01 | Yes |
| 2 | Fix sitemap (www consistency, add venue pages) | 73-02 | Yes |
| 3 | Enhanced SEO (OG images, LocalBusiness schema) | 73-03 | Yes |
| 4 | QA + verification | 73-04 | No |

---

## Module Index

| ID | Module | Status | Plan File |
|----|--------|--------|-----------|
| 73-01 | Venue Page Metadata Fix | Not Started | `73-01-venue-metadata-fix.md` |
| 73-02 | Sitemap Fixes | Not Started | `73-02-sitemap-fixes.md` |
| 73-03 | Enhanced SEO | Not Started | `73-03-enhanced-seo.md` |
| 73-04 | QA & Verification | Not Started | `73-04-qa.md` |

---

## Success Criteria

- [ ] Venue pages have correct canonical URLs (e.g., `https://kudoscourts.com/venues/kitchenline-pickleball-center`)
- [ ] Venue pages have venue-specific titles and descriptions
- [ ] Sitemap uses consistent www URLs
- [ ] Venue pages are included in sitemap
- [ ] `pnpm lint` and `pnpm build` pass
- [ ] Manual verification of meta tags via View Source

---

## Out of Scope (Deferred)

- Blog content strategy
- Backlink building
- Page speed optimizations (separate epic)
