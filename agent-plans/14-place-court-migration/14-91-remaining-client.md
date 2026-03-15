# Remaining Work Checklist — Client (UI/UX)

**Owner:** Client Dev  
**Scope:** Replace mocks, wire booking, ensure cohesive flows and design system compliance

**Status:** Completed (verified 2026-01-12)

## References

- Plan overview: `agent-plans/14-place-court-migration/14-00-overview.md`
- Player UI plan: `agent-plans/14-place-court-migration/14-04-player-ui.md`
- Owner UI plan: `agent-plans/14-place-court-migration/14-03-owner-ui.md`
- Design system: `business-contexts/kudoscourts-design-system.md`

---

## A) Replace Mock Discovery / Place Data With Real APIs

- [x] Replace `src/shared/lib/place-data.ts` usage in discovery
  - [x] `src/features/discovery/hooks/use-discovery.ts` uses `trpc.place.list`
  - [x] Discovery filters include `sportId`
- [x] Replace `src/features/discovery/hooks/use-place-detail.ts` to use `trpc.place.getById`
- [x] Replace `usePlaceAvailability` to call real availability endpoints:
  - [x] `trpc.availability.getForCourt` when mode = court
  - [x] `trpc.availability.getForPlaceSport` when mode = any

---

## B) Wire Booking Submission (Remove Stub)

- [x] Update `src/app/(auth)/places/[placeId]/book/page.tsx` to call tRPC instead of `setTimeout`
  - [x] If `mode=court`: call `reservation.createForCourt`
  - [x] If `mode=any`: call `reservation.createForAnyCourt`
- [x] On success:
  - [x] Navigate to reservation detail page (and payment page if required)
  - [x] Show toast success/error states
- [x] Add client hooks:
  - [x] `useCreateReservationForCourt`
  - [x] `useCreateReservationForAnyCourt`

---

## C) Player Flow Cohesion + UX Details

- [x] Ensure consistent “Step 1 of 2 / Step 2 of 2” and copy across:
  - [x] `src/app/(public)/places/[placeId]/page.tsx`
  - [x] `src/app/(auth)/places/[placeId]/book/page.tsx`
- [x] Ensure duration UX is consistent and constrained:
  - [x] Only 60/120/180 (or multiples of 60)
  - [x] Total price updates visibly
- [x] Ensure “Any available” clearly communicates selection rule: “lowest total price”

---

## D) Owner Flow Cohesion + Form UX

- [x] Hours editor UX:
  - [x] Clearly support overnight (end < start) with helper text
  - [x] Avoid user confusion by showing how it will be split
- [x] Pricing rules editor UX:
  - [x] Detect overlaps and show immediate feedback
  - [x] Ensure labels + loading/success/error feedback
- [x] Place/court filters are consistent across owner pages (use shared filter component)

---

## E) Design System / ui-ux-pro-max Requirements

- [x] Multi-step flows show progress indicators
- [x] Forms have labels and submit feedback
- [x] Use Teal sparingly for primary CTA; Orange for availability cues; Red only destructive
- [x] No layout shift on hover; visible focus states

---

## F) Validation

- [x] `pnpm lint`
- [x] `pnpm build`

---

## Completion Notes

- Discovery + place detail are wired to real APIs: `src/features/discovery/hooks/use-discovery.ts`, `src/features/discovery/hooks/use-place-detail.ts`.
- Booking submission uses tRPC reservation endpoints: `src/app/(auth)/places/[placeId]/book/page.tsx`, `src/features/reservation/hooks/use-create-reservation-for-court.ts`, `src/features/reservation/hooks/use-create-reservation-for-any-court.ts`.
- Optional cleanup: `src/shared/lib/place-data.ts` still exists but is no longer referenced by discovery.
