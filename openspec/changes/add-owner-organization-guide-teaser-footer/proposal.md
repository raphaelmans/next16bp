## Why

KudosCourts already has a public owner acquisition page and a public guides system, but it does not yet give venue operators a deeper organization-focused guide that explains how to move from setup wizard to day-to-day operations. Adding that guide and promoting it from `/owners/get-started` gives owners a more complete pre-signup and pre-go-live path without forcing a redesign of the existing funnel.

## What Changes

- Add a new public owner guide focused on setting up and operating a sports venue organization on KudosCourts.
- Keep the existing owner guide about listing a venue online unchanged.
- Surface the new organization guide from the public owners get-started page through a dedicated teaser section near the bottom of the page.
- Append the shared public footer to `/owners/get-started` so the page ends with the same navigation system used on other public discovery surfaces.
- Keep the owners route boundary thin by reusing the existing guide/article system and feature-level page composition.

## Capabilities

### New Capabilities
- `owner-guides`: Public owner guide articles and index surfacing for organization setup and operating guidance.
- `owners-get-started-guide-promotion`: Guide teaser and shared-footer composition on the public owners get-started page.

### Modified Capabilities

None.

## Impact

- **Guide content**: `src/features/guides/content/guides.ts` gains a new owner guide entry and related public links.
- **Public guide surfaces**: Existing `/guides` index and `/guides/[slug]` article route automatically gain the new owner guide.
- **Owners public page**: Public owner page composition gains an organization-guide teaser section and the shared discovery footer.
- **Telemetry/UI wiring**: Owners-page CTA tracking may gain one new guide-teaser location while preserving the existing registration flow.
- **Backend/data**: No API, database, or auth contract changes.
