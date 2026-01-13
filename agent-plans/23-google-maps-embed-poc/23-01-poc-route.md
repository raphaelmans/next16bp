# Phase 1–4: Google Maps URL → Embed PoC

**Dependencies:** none  
**Parallelizable:** Partial  
**User Stories:** `US-23-01`

---

## Objective

Provide a cheap PoC that demonstrates:
1) Resolving a Google Maps short URL to the canonical URL, and
2) Extracting `lat/lng/zoom` for embedding.

---

## Modules

### Module 2A: API `POST /api/poc/google-loc`

**Route:** `src/app/api/poc/google-loc/route.ts`

#### Input

| Field | Type | Required | Validation |
|------|------|----------|------------|
| url | string | Yes | Must be https and host allowlisted |

#### Output

| Field | Type | Notes |
|------|------|------|
| resolvedUrl | string | Final URL after redirect resolution |
| suggestedName | string | Parsed from `/maps/place/<name>` if present |
| lat/lng/zoom | number | Parsed from URL (marker preferred) |
| embedSrc | string | `https://www.google.com/maps/embed/v1/view?...` if key configured |
| warnings | string[] | Missing key / parse failures / etc |

#### Redirect resolution rules

- Follow up to 5 hops.
- Allowlist hosts: `maps.app.goo.gl`, `google.com`, `www.google.com`.
- Reject any redirect to an unrecognized host.

#### Location parsing rules

1. Prefer marker coords: `!3d<lat>!4d<lng>`
2. Else fall back to viewport center: `@<lat>,<lng>,<zoom>z`
3. Clamp zoom to `[0..21]`, default to 17.

---

### Module 3A: Page `/poc/google-loc`

**Route:** `src/app/(public)/poc/google-loc/page.tsx`

#### UI layout (PoC)

```
┌──────────────────────────────────────────────┐
│ PoC: Google Maps URL → Coordinates → Embed   │
│                                              │
│ [ Google Maps URL input                  ]   │
│ [Use sample]                                │
│ [Preview]                                   │
│                                              │
│ Result                                      │
│ - Resolved URL (clickable)                  │
│ - Suggested name                            │
│ - Coordinates / zoom / source               │
│ - Warnings (if any)                         │
│                                              │
│ [ iframe embed preview ]                    │
└──────────────────────────────────────────────┘
```

#### UX states

- Idle
- Loading
- Error
- Success (with/without embed key)

---

### Module 1A: Env + key guide

- Add `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` to env validation (`src/lib/env/index.ts`).
- Add placeholder to `.env.example`.
- Add setup guide: `guides/client/references/14-google-maps-embed.md`.

---

## Testing Checklist

- [ ] Try sample `maps.app.goo.gl` URL → shows embed
- [ ] Try a non-Google URL → API rejects
- [ ] Unset `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` → PoC still shows parsed coords + warning
- [ ] Run `pnpm lint`
- [ ] Run `pnpm build`
