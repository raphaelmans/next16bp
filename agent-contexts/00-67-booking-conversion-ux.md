# [00-67] Booking Conversion UX

> Date: 2026-01-19
> Previous: 00-66-admin-photo-removal.md

## Summary

Implemented booking conversion UX improvements across the public detail and schedule flow, added log-only funnel telemetry hooks, and introduced mobile sticky CTAs. Also added auth context copy so users know they will return to their reservation after signing in.

## Changes Made

### Backend Telemetry

| File | Change |
|------|--------|
| `src/app/api/public/track/route.ts` | Added log-only telemetry endpoint with Zod validation, PII guardrails, and structured logging. |
| `src/shared/lib/clients/telemetry-client/index.ts` | Added client helper for best-effort telemetry POSTs. |

### Booking Flow UX + Resume

| File | Change |
|------|--------|
| `src/app/(public)/places/[placeId]/page.tsx` | Guest reserve now redirects to schedule URL; added slot-selected telemetry, login-start telemetry, and mobile sticky CTA; adjusted layout padding. |
| `src/app/(public)/courts/[id]/schedule/page.tsx` | Added slot-selected + reserve telemetry, login-start telemetry, and mobile sticky CTA; added bottom padding for sticky bar. |

### Auth + Discovery Touchpoints

| File | Change |
|------|--------|
| `src/features/auth/components/login-form.tsx` | Added booking context copy when redirect points to schedule. |
| `src/features/auth/components/register-form.tsx` | Added booking context copy when redirect points to schedule. |
| `src/shared/components/kudos/place-card.tsx` | Added discovery click telemetry. |
| `src/features/discovery/components/navbar.tsx` | Added search telemetry on submit. |
| `src/app/page.tsx` | Added search input + popular chips, telemetry on search and CTA clicks. |

## Key Decisions

- Resume-after-login is routed to schedule URLs to preserve selection state via query params.
- Telemetry is log-only (no vendor), using best-effort client POSTs.
- Sticky CTAs are mobile-only and reflect existing CTA logic to avoid duplicate flows.

## Next Steps

- [ ] Optional: add explicit telemetry for booking confirmation on the authenticated review page.
- [ ] Review analytics payloads for PII safety in production logs.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
