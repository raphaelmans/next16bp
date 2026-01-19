# Developer Checklist - Booking Conversion UX

**Focus Area:** Conversion funnel friction reduction  
**Modules:** 1A, 2B, 3A/3B (optional), 4A/4B (optional)

---

## Phase 1

- [ ] Implement Module 1A (resume-after-login) with schedule redirect.
- [ ] Validate guest flow end-to-end.

## Phase 2

- [ ] Implement Module 2B (auth context messaging).
- [ ] Verify doesn’t shift layout.

## Phase 3 (Optional)

- [ ] Add sticky CTA on schedule page.
- [ ] Add sticky CTA on place detail page.

## Phase 4 (Optional)

- [ ] Ship amenities filter (Plan 42).
- [ ] Verify landing + navbar routing consistency.

---

## Final Validation

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
