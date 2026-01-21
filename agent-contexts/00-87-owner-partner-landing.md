# [00-87] Owner Partner Landing

> Date: 2026-01-21
> Previous: 00-86-place-detail-listing-help-ui.md

## Summary

Added a shareable owner onboarding entrypoint at `/list-your-venue` and updated the onboarding flow to preserve user intent via a `next=` continuation parameter. Public CTAs now route to the landing page, while authenticated owners are routed directly to the next setup step.

## Changes Made

### UI/UX

| File | Change |
| --- | --- |
| `src/app/(public)/list-your-venue/page.tsx` | Added a conversion-focused partner landing page (bento steps + verification section + FAQ) with CTAs into onboarding. |
| `src/features/discovery/components/navbar.tsx` | Updated "List Your Venue" action: logged-out users go to `/list-your-venue`, owners go to `/owner/places/new`, non-owner authenticated users go to onboarding with `next`. |
| `src/features/discovery/components/footer.tsx` | Updated "List Your Venue" link to `/list-your-venue`. |
| `src/shared/components/kudos/ad-banner.tsx` | Routed discovery/owner banners to `/list-your-venue` (verification deep link uses `#verification`). |
| `src/features/home/components/organization-section.tsx` | Routed partner CTA to `/list-your-venue`. |
| `src/features/reservation/components/owner-cta-section.tsx` | Routed partner CTA to `/list-your-venue`. |

### Routing / Funnel Continuation

| File | Change |
| --- | --- |
| `src/shared/lib/app-routes.ts` | Added `appRoutes.listYourVenue.base` for `/list-your-venue`. |
| `src/app/(auth)/owner/onboarding/page.tsx` | Added `next` query param handling with safe allowlist (`/owner/*`) and redirected existing owners to `next` instead of `/owner`. |
| `src/app/(auth)/owner/onboarding/organization-form-client.tsx` | Redirected users with an organization to `nextHref` (instead of dashboard) after org creation. |
| `src/app/(owner)/owner/places/new/page.tsx` | Updated fallback onboarding link to include `next=/owner/places/new`. |
| `src/app/(owner)/owner/places/[placeId]/courts/new/page.tsx` | Updated fallback onboarding link to include `next` back to the intended court creation route. |
| `src/app/(owner)/owner/courts/setup/page.tsx` | Updated fallback onboarding link to include `next` back to the setup route. |

### Telemetry

| File | Change |
| --- | --- |
| `src/shared/lib/clients/telemetry-client/index.ts` | Added event names for the new landing page funnel instrumentation. |

### Planning Artifacts

| File | Change |
| --- | --- |
| `agent-plans/user-stories/00-onboarding/00-00-overview.md` | Added US-00-09 to story index. |
| `agent-plans/user-stories/00-onboarding/00-09-owner-list-your-venue-landing.md` | Added user story for partner landing + seamless continuation. |
| `agent-plans/55-owner-partner-landing/55-00-overview.md` | Added master plan for `/list-your-venue` + onboarding `next` continuation. |
| `agent-plans/55-owner-partner-landing/55-01-landing-and-routing.md` | Added implementation phase plan (landing + routing + continuation). |
| `agent-plans/55-owner-partner-landing/55-02-qa.md` | Added QA checklist for the funnel. |
| `agent-plans/context.md` | Logged new plan and story in changelog. |

### Tooling / Validation

| Command | Result |
| --- | --- |
| `pnpm format` | Passed (Biome format) |
| `pnpm lint` | Passed (Biome check) |
| `pnpm build` | Passed (Next.js build) |

## Key Decisions

- Canonical owner acquisition URL is `/list-your-venue` (marketing-friendly and consistent with existing nav copy).
- Use `?next=/owner/places/new` to preserve onboarding intent and reduce drop-offs.
- Prevent open redirects by only allowing `next` values under `/owner/*`.

## Commands to Continue

```bash
pnpm dev
```
