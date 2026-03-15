# UI + Server Integration Checklist - Booking Conversion UX

**Scope:** Replace placeholders with real data and wire telemetry + redirects.

---

## Resume After Login

- [ ] On place detail (`src/app/(public)/places/[placeId]/page.tsx`), redirect guests to login with `redirect=<scheduleHref>`.
- [ ] Confirm schedule URL includes `date`, `duration`, `sportId`, `mode`, `courtId`, `startTime`.
- [ ] Verify guest flow: select → login → schedule resumes selection.

## Sticky CTA Integration

- [ ] Schedule page CTA uses real `selectedOption` data.
- [ ] Place detail CTA uses real selected slot state.
- [ ] CTA button calls existing reserve handlers (no duplicated logic).

## Auth Context Messaging

- [ ] Only show helper text when `redirect` query param exists.
- [ ] Ensure copy renders on both login and register.

## Telemetry Wiring

- [ ] Emit funnel events to `/api/public/track` on key actions.
- [ ] Ensure no PII is sent in payloads.

## Validation

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
