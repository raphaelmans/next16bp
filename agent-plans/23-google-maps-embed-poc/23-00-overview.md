# Google Maps URL → Embed PoC - Master Plan

## Overview

Add a proof-of-concept page at `/poc/google-loc` that lets a developer paste a Google Maps URL (including `maps.app.goo.gl` short links), resolves it server-side, extracts `lat/lng/zoom`, and renders a Google Maps iframe embed.

This plan intentionally targets the **lowest ongoing cost** setup:
- No Places API
- No Geocoding API
- No Time Zone API
- Only the Maps Embed API key for iframe rendering (key is exposed client-side; must be restricted)

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/23-google-maps-embed-poc/` |
| Maps Embed docs | https://developers.google.com/maps/documentation/embed |
| API security best practices | https://developers.google.com/maps/api-security-best-practices |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Env + docs | 1A | Yes |
| 2 | Server API | 2A | Yes |
| 3 | PoC UI | 3A | Partial |
| 4 | Hardening | 4A | No |
| 5 | Public UI embeds | 5A | Partial |

---

## Module Index

### Phase 1: Env + docs

| ID | Module | Plan File |
|----|--------|----------|
| 1A | Add embed key env + guide | `23-01-poc-route.md` |

### Phase 2: Server API

| ID | Module | Plan File |
|----|--------|----------|
| 2A | `POST /api/poc/google-loc` | `23-01-poc-route.md` |

### Phase 3: PoC UI

| ID | Module | Plan File |
|----|--------|----------|
| 3A | `/poc/google-loc` page | `23-01-poc-route.md` |

### Phase 4: Hardening

| ID | Module | Plan File |
|----|--------|----------|
| 4A | SSRF / validation / UX polish | `23-01-poc-route.md` |

### Phase 5: Public UI embeds

| ID | Module | Plan File |
|----|--------|----------|
| 5A | Discovery + reservation embed UI | `23-02-embed-ui.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Embed method | Maps Embed API `view` mode | Stable iframe embedding (avoids `x-frame-options` issues) |
| Data enrichment | None (PoC) | Avoids paid Google web services |
| Short links | Resolve server-side redirects | `maps.app.goo.gl` must be dereferenced to find coords |
| Security posture | Allowlist redirect hosts | Avoid SSRF and open redirect abuse |

---

## Success Criteria

- [ ] `/poc/google-loc` loads and can preview the sample short link
- [ ] API rejects non-Google redirect targets
- [ ] Missing `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` shows a clear warning
- [ ] Map embeds appear in discovery map view and reservation details
- [ ] `pnpm lint` and `pnpm build` pass
