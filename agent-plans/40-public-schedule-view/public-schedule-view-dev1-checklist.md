# Developer Checklist (Dev1)

**Focus Area:** Public schedule view + CTA wiring
**Modules:** 1A, 2A, 3A

---

## Module 1A: Routing + CTA

- [ ] Add `appRoutes.courts.schedule()` (and optional `appRoutes.places.schedule()`).
- [ ] Add new route `src/app/(public)/courts/[id]/schedule/page.tsx`.
- [ ] (Optional) Add alias route `src/app/(public)/places/[placeId]/schedule/page.tsx`.
- [ ] Add secondary CTA to `src/app/(public)/places/[placeId]/page.tsx` that links to schedule and preserves state.

## Module 2A: Schedule page v1

- [ ] Implement query param parsing with nuqs.
- [ ] Fetch place + courts; compute courts for selected sport.
- [ ] Fetch per-court availability in parallel.
- [ ] Render court lanes and selectable time slots.
- [ ] Implement "Continue" to existing checkout route.
- [ ] Implement guest redirect with return-to-schedule.

## Module 3A: Validation

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
