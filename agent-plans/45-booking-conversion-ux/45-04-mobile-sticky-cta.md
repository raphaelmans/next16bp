# Phase 3: Mobile Sticky CTA

**Dependencies:** Plan 40 schedule view + Plan 16 place detail UX  
**Parallelizable:** Partial

---

## Objective

On mobile, keep the primary action reachable once the user has made a valid selection (Booking.com pattern). This reduces scroll friction and increases completion rate.

---

## Modules

### Module 3A: Sticky CTA on schedule page

Target: `src/app/(public)/courts/[id]/schedule/page.tsx`

Behavior:
- When `selectedOption` exists, render a bottom sticky bar on small screens.
- Left: selection summary (date/time + price if available).
- Right: primary CTA (teal) to reserve.

A11y:
- Button is focusable.
- Respect safe-area insets.

---

### Module 3B: Sticky CTA on place detail page

Target: `src/app/(public)/places/[placeId]/page.tsx`

Behavior:
- When `hasSelectedSlot`, show bottom sticky bar with "Reserve now".
- When only date selected, optionally show "See available times" and scroll to times.

Note: This should mirror the existing summary CTA (avoid two competing CTAs).

---

## Validation Checklist

- [ ] No content hidden behind sticky bar.
- [ ] No horizontal scroll on mobile.
- [ ] `prefers-reduced-motion` respected.
