## Context

The repo already has a content-driven public guides system with a shared guides index, a shared guide article page, and guide metadata generated from `GUIDE_ENTRIES`. The public owners landing page also already exists as a dedicated feature experience with metadata defined at the route boundary and rich marketing content rendered lower in the feature layer.

This change stays entirely inside those existing patterns. There is no new backend capability, no new route family, and no reason to create route-local presentation modules under `src/app/**`.

## Goals / Non-Goals

**Goals:**
- Add a second owner guide that focuses on organization setup and operations.
- Promote that guide from `/owners/get-started` without disturbing the current conversion path.
- End `/owners/get-started` with the shared public footer used elsewhere on discovery surfaces.
- Keep the implementation additive and low-risk by reusing existing guide and footer primitives.

**Non-Goals:**
- No redesign of the entire owners get-started page.
- No changes to backend routes, database schema, or auth flow.
- No protected `/organization/*` deep links from the public guide.
- No footer information architecture rewrite in this change.

## Decisions

### 1. Reuse the existing guide content system

**Decision:** Add the new organization guide as another `GUIDE_ENTRIES` item under the existing `/guides/[slug]` flow instead of building a bespoke page.

This keeps metadata, index surfacing, article layout, and structured-data behavior aligned with the current public guides implementation. It also reduces scope to content plus composition.

**Alternative considered:** Build a standalone public guide route outside the shared guide system. Rejected because it would duplicate routing, metadata, and article rendering patterns for a single owner guide.

### 2. Keep the route boundary thin and move composition to the feature layer

**Decision:** Leave `src/app/(public)/owners/get-started/page.tsx` responsible for metadata and JSON-LD only, and extend the feature-level page composition to add the guide teaser and footer.

This follows the repo’s route-boundary rule and avoids piling more UI concerns into the route file.

**Alternative considered:** Render the teaser and footer directly from the route page. Rejected because it pushes page composition into `src/app/**` even though the repo expects feature UI to live outside the route boundary.

### 3. Use a dedicated teaser section after FAQ and before the final CTA

**Decision:** Add a dedicated guide teaser section near the bottom of `/owners/get-started`, specifically after the FAQ block and before the existing final CTA.

This placement gives the guide enough prominence to matter without interrupting the story earlier in the page. It also preserves the current final CTA as the last conversion-focused block before the footer.

**Alternative considered:** Add the guide only as an extra button inside the existing final CTA. Rejected because the guide would be too easy to miss and would not have room to explain why an owner should read it.

### 4. Reuse the shared public footer unchanged

**Decision:** Append the existing shared `Footer` component after the current final CTA and keep footer navigation unchanged unless implementation reveals a clear broken link or omission.

The task is to bring the owners page into the shared public navigation system, not to redesign footer IA.

**Alternative considered:** Add a special footer variant for the owners page. Rejected because it increases maintenance cost and breaks consistency for a simple landing page extension.

## Risks / Trade-offs

- **[The new guide teaser could compete with the sign-up CTA]** -> Mitigation: place it after FAQ, keep the final CTA intact, and make account creation the teaser’s secondary action.
- **[Public guide links could accidentally point to protected owner routes]** -> Mitigation: constrain guide related links and teaser destinations to public entry points only.
- **[Footer addition could create an abrupt ending if spacing is wrong]** -> Mitigation: compose the footer only after the existing final CTA and preserve the page’s current section rhythm.
- **[A second owner guide could feel redundant with the existing listing guide]** -> Mitigation: keep the new guide explicitly focused on organization setup, notifications, team access, and reservation handling.

## Migration Plan

1. Add the new owner guide entry to the shared guides content source.
2. Extend the public owners page composition with the guide teaser section and shared footer.
3. Validate `/guides`, the new guide slug, and `/owners/get-started`.
4. Run `pnpm lint`.

Rollback:
- Remove the new guide entry from guides content.
- Remove the teaser/footer composition from the public owners page wrapper.

## Open Questions

None.
