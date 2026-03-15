# 73-01: Venue Page Metadata Fix

**Priority:** P0 (Critical)
**Status:** Not Started
**Parallelizable:** Yes

---

## Problem

Venue detail pages at `/venues/[slug]` have broken metadata:

### Current (Broken)

```html
<title>Court details | KudosCourts</title>
<meta name="description" content="View court details on KudosCourts."/>
<link rel="canonical" href="https://kudoscourts.com/venues/undefined"/>
<meta property="og:url" content="https://kudoscourts.com/venues/undefined"/>
<meta property="og:title" content="Court details"/>
```

### Expected (Fixed)

```html
<title>Kitchenline Pickleball Center | KudosCourts</title>
<meta name="description" content="Book pickleball courts at Kitchenline Pickleball Center in Mandaue City, Cebu. Check availability and reserve online."/>
<link rel="canonical" href="https://kudoscourts.com/venues/kitchenline-pickleball-center"/>
<meta property="og:url" content="https://kudoscourts.com/venues/kitchenline-pickleball-center"/>
<meta property="og:title" content="Kitchenline Pickleball Center"/>
```

---

## Root Cause

The `generateMetadata` function in the venue page is likely:
1. Not awaiting the params properly (Next.js 15 async params)
2. Or falling back to defaults when place data fetch fails
3. Or the slug param name doesn't match the folder name

---

## Files to Investigate

| File | Purpose |
|------|---------|
| `src/app/(public)/venues/[slug]/page.tsx` | Venue detail page (if exists) |
| `src/app/(public)/places/[placeId]/page.tsx` | Alt venue detail page |
| `src/shared/lib/metadata.ts` | Shared metadata helpers (if exists) |

---

## Implementation Steps

### 1. Locate the venue detail page

```bash
find src/app -name "page.tsx" | xargs grep -l "placeId\|venue\|slug"
```

### 2. Fix generateMetadata function

The metadata function must:
- Await params: `const { slug } = await params`
- Fetch place data before returning metadata
- Use place name in title
- Use place address/city in description
- Build correct canonical URL

Example pattern:

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; // Next.js 15 requires await
  
  const place = await getPlaceBySlug(slug);
  
  if (!place) {
    return {
      title: "Venue not found | KudosCourts",
    };
  }
  
  const title = `${place.name} | KudosCourts`;
  const description = `Book ${place.sports.join(", ")} courts at ${place.name} in ${place.city}. Check availability and reserve online.`;
  const url = `https://kudoscourts.com/venues/${slug}`;
  
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: place.name,
      description,
      url,
      images: place.coverImageUrl ? [{ url: place.coverImageUrl }] : undefined,
    },
    twitter: {
      title: place.name,
      description,
    },
  };
}
```

### 3. Verify OG image

If venue has a cover image, include it in OG metadata.

---

## Acceptance Criteria

- [ ] `/venues/kitchenline-pickleball-center` shows title "Kitchenline Pickleball Center | KudosCourts"
- [ ] Canonical URL is `https://kudoscourts.com/venues/kitchenline-pickleball-center`
- [ ] OG tags include venue name and description
- [ ] Twitter card tags are populated
- [ ] No "undefined" appears in any meta tags

---

## Testing

```bash
# Check meta tags via curl
curl -s https://www.kudoscourts.com/venues/kitchenline-pickleball-center | grep -E "<title>|canonical|og:title|og:url"

# Local dev
pnpm dev
# Then check http://localhost:3000/venues/kitchenline-pickleball-center
```

---

## References

- Next.js 15 Metadata: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- Next.js 15 Async Params: https://nextjs.org/docs/messages/sync-dynamic-apis
