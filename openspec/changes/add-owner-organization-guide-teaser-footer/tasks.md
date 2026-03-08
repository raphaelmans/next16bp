## 1. Owner Guide Content

- [x] 1.1 Add a new owner-guide entry in `src/features/guides/content/guides.ts` for the organization setup and operations guide, including owner-focused intro, sections, FAQs, and public related links
- [x] 1.2 Verify the new guide slug, title, description, and related links integrate with the existing guides index, article route, and metadata flow

## 2. Owners Get-Started Promotion And Footer

- [x] 2.1 Update the public owners page composition layer to render the existing owners get-started experience, then the organization-guide teaser, then the existing final CTA, then the shared footer
- [x] 2.2 Implement the organization-guide teaser copy and CTA wiring, preserving the current owner registration flow and consistent CTA tracking
- [x] 2.3 Reuse the shared public footer on `/owners/get-started` without introducing a page-specific footer variant

## 3. Validation

- [x] 3.1 Manually verify `/guides`, `/guides/how-to-set-up-your-sports-venue-organization-on-kudoscourts`, and `/owners/get-started` for content order, CTA destinations, and footer presence across mobile and desktop
- [x] 3.2 Run `pnpm lint`
