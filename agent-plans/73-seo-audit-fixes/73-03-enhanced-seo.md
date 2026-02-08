# 73-03: Enhanced SEO (P2)

**Priority:** P2 (Nice to have)
**Status:** Not Started
**Parallelizable:** Yes
**Dependencies:** 73-01 should be done first

---

## Enhancements

### 1. Dynamic OG Images for Venues

Generate OpenGraph images dynamically using venue cover photo + branding.

**Option A: Use venue cover image directly**

```typescript
openGraph: {
  images: place.coverImageUrl 
    ? [{ url: place.coverImageUrl, width: 1200, height: 630, alt: place.name }]
    : [{ url: `${baseUrl}/og-default.png` }],
}
```

**Option B: Generate branded OG image (advanced)**

Use `@vercel/og` or similar to generate images with:
- Venue photo as background
- KudosCourts logo overlay
- Venue name text

File: `src/app/venues/[slug]/opengraph-image.tsx`

### 2. LocalBusiness Schema for Verified Venues

Add structured data for verified venues to enable rich results.

```typescript
// In venue page
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  "name": place.name,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": place.address,
    "addressLocality": place.city,
    "addressCountry": "PH",
  },
  "geo": place.latitude && place.longitude ? {
    "@type": "GeoCoordinates",
    "latitude": place.latitude,
    "longitude": place.longitude,
  } : undefined,
  "image": place.coverImageUrl,
  "url": `https://www.kudoscourts.com/venues/${place.slug}`,
  "telephone": place.phone, // if available
  "openingHours": "Mo-Su", // derive from court hours if available
};
```

### 3. Breadcrumb Schema

Add breadcrumb structured data for better SERP appearance:

```typescript
const breadcrumbData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.kudoscourts.com" },
    { "@type": "ListItem", "position": 2, "name": "Courts", "item": "https://www.kudoscourts.com/courts" },
    { "@type": "ListItem", "position": 3, "name": place.city, "item": `https://www.kudoscourts.com/courts/locations/${place.provinceSlug}/${place.citySlug}` },
    { "@type": "ListItem", "position": 4, "name": place.name },
  ],
};
```

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/app/venues/[slug]/opengraph-image.tsx` | Dynamic OG image (optional) |
| `src/app/(public)/places/[placeId]/page.tsx` | Add structured data |
| `src/shared/components/structured-data.tsx` | Reusable schema component |

---

## Acceptance Criteria

- [ ] Verified venues have LocalBusiness/SportsActivityLocation schema
- [ ] Schema validates at https://validator.schema.org/
- [ ] OG images show venue photo (or fallback)
- [ ] Breadcrumbs appear in Google rich results (after indexing)

---

## Testing

```bash
# Test structured data
curl -s https://www.kudoscourts.com/venues/kitchenline-pickleball-center | grep -o '<script type="application/ld+json">.*</script>'

# Validate with Google
# https://search.google.com/test/rich-results
```

---

## References

- Schema.org SportsActivityLocation: https://schema.org/SportsActivityLocation
- Google Rich Results Test: https://search.google.com/test/rich-results
- Vercel OG: https://vercel.com/docs/functions/og-image-generation
