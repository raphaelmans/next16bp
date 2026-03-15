# 73-02: Sitemap Fixes

**Priority:** P1 (High)
**Status:** Not Started
**Parallelizable:** Yes

---

## Problems

### 1. URL Consistency (www vs non-www)

**Current:** Sitemap uses `https://kudoscourts.com/` (non-www)
**Actual:** Site redirects to `https://www.kudoscourts.com/`

This causes:
- Crawl budget waste (Google follows redirect)
- Potential indexing confusion

### 2. Missing Venue Pages

**Current sitemap includes:**
- Homepage
- /courts
- /owners/get-started
- /contact-us, /about, /blog
- /terms, /privacy, /cookies
- Location pages (/courts/locations/cebu, etc.)

**Missing:**
- Individual venue pages (/venues/[slug])

---

## Files to Investigate

| File | Purpose |
|------|---------|
| `src/app/sitemap.ts` | Dynamic sitemap generation |
| `next.config.ts` | URL/redirect configuration |
| `vercel.json` | Vercel redirects (if any) |

---

## Implementation Steps

### 1. Fix URL consistency

**Option A: Use www everywhere (recommended)**

Update sitemap.ts to use `https://www.kudoscourts.com`:

```typescript
const BASE_URL = "https://www.kudoscourts.com";
```

**Option B: Remove www redirect**

Update Vercel/Next config to serve from non-www and redirect www → non-www.

### 2. Add venue pages to sitemap

Fetch all published venues and include them:

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.kudoscourts.com";
  
  // Static pages
  const staticPages = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/courts`, changeFrequency: "daily", priority: 0.9 },
    // ... other static pages
  ];
  
  // Dynamic venue pages
  const places = await db.query.places.findMany({
    where: eq(places.status, "PUBLISHED"),
    columns: { slug: true, updatedAt: true },
  });
  
  const venuePages = places.map((place) => ({
    url: `${baseUrl}/venues/${place.slug}`,
    lastModified: place.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  
  // Dynamic location pages
  // ... existing location logic
  
  return [...staticPages, ...venuePages, ...locationPages];
}
```

### 3. Update robots.txt sitemap reference

If robots.txt hardcodes the sitemap URL, update it:

```
Sitemap: https://www.kudoscourts.com/sitemap.xml
```

---

## Acceptance Criteria

- [ ] All sitemap URLs use `https://www.kudoscourts.com`
- [ ] Venue pages appear in sitemap
- [ ] robots.txt sitemap reference matches
- [ ] Sitemap is valid XML (test with Google Search Console)

---

## Testing

```bash
# Fetch and check sitemap
curl -sL https://www.kudoscourts.com/sitemap.xml | head -50

# Validate XML
curl -sL https://www.kudoscourts.com/sitemap.xml | xmllint --noout -

# Check for venue URLs
curl -sL https://www.kudoscourts.com/sitemap.xml | grep "/venues/"
```

---

## References

- Next.js Sitemap: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- Google Sitemap Guidelines: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
