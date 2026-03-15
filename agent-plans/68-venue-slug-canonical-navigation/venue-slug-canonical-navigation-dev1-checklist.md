# Developer 1 Checklist

**Focus Area:** Stop UUID -> slug flicker on venue detail
**Modules:** 1A, 1B, 1C, 2A, 3A

---

## Module 1A: mapPlaceSummary includes slug

**Reference:** `agent-plans/68-venue-slug-canonical-navigation/68-01-slug-propagation.md`

- [ ] Update `src/features/discovery/helpers.ts` to return `slug`
- [ ] Verify any callers expecting the old shape still compile

---

## Module 1B: listSummary includes slug

**Reference:** `agent-plans/68-venue-slug-canonical-navigation/68-01-slug-propagation.md`

- [ ] Update `src/modules/place/repositories/place.repository.ts` types + mapping
- [ ] Confirm `trpc.place.listSummary` includes `place.slug`

---

## Module 1C: discovery summary threads slug to PlaceCard

**Reference:** `agent-plans/68-venue-slug-canonical-navigation/68-01-slug-propagation.md`

- [ ] Update `src/features/discovery/hooks/use-discovery.ts` summary types
- [ ] Update `buildDiscoveryPlaceCard` to include slug

---

## Module 2A: server-side canonical redirect

**Reference:** `agent-plans/68-venue-slug-canonical-navigation/68-02-server-canonical-redirect.md`

- [ ] Move client component into `src/app/(public)/places/[placeId]/place-detail-client.tsx`
- [ ] Replace `src/app/(public)/places/[placeId]/page.tsx` with server wrapper + redirect
- [ ] Update `src/app/(public)/venues/[placeId]/page.tsx` to re-export canonical page

---

## Module 3A: QA + validation

**Reference:** `agent-plans/68-venue-slug-canonical-navigation/68-03-qa.md`

- [ ] Manual checks (discovery click + direct UUID URL)
- [ ] Run `pnpm lint`
- [ ] Run `TZ=UTC pnpm build`
