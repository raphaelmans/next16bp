# [00-70] Owner Verification Routing

> Date: 2026-01-20
> Previous: 00-69-owner-place-verification-data.md

## Summary

Added a dedicated owner verification route per place, replaced the inline verification panel on the edit page with a CTA, and updated the owner verification landing page to list places and deep-link into verification.

## Changes Made

### Owner Verification Routing

| File | Change |
| --- | --- |
| `src/app/(owner)/owner/verify/[placeId]/page.tsx` | New dedicated verification page with PlaceVerificationPanel and quick links. |
| `src/app/(owner)/owner/places/[placeId]/edit/page.tsx` | Removed inline verification panel, replaced with CTA card linking to verification. |
| `src/app/(owner)/owner/verify/page.tsx` | Added per-place cards with status badges and verification links. |

### Planning

| File | Change |
| --- | --- |
| `agent-plans/46-place-verification/46-06-owner-verification-routing.md` | Added routing plan phase doc. |
| `agent-plans/46-place-verification/46-00-overview.md` | Updated phases/index to include owner routing. |

## Key Decisions

- Keep verification flow on a dedicated route for clarity and to avoid cluttering the edit form.
- Provide direct entry points from both the owner landing page and edit page to reduce confusion.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
