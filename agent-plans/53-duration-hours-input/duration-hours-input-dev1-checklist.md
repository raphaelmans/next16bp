# Developer 1 Checklist

**Focus Area:** Public duration input + validation
**Modules:** 1A, 1B

---

## Module 1A: Shared Duration Normalizer

**Reference:** `53-01-public-duration-hours.md`
**User Story:** `US-06-03`
**Dependencies:** None

### Setup

- [ ] Create `src/shared/lib/duration.ts`.

### Implementation

- [ ] Add `normalizeDurationMinutes` helper with 60-1440 and 60-min increments.
- [ ] Export helper for reuse.

### Testing

- [ ] Verify invalid values fall back to 60.

---

## Module 1B: Public Duration Input UI

**Reference:** `53-01-public-duration-hours.md`
**User Story:** `US-06-01`, `US-06-02`, `US-06-03`
**Dependencies:** Module 1A

### Setup

- [ ] Confirm duration sections in place detail and schedule pages.

### Implementation

- [ ] Replace duration button group in `src/app/(public)/places/[placeId]/page.tsx`.
- [ ] Replace duration button group in `src/app/(public)/courts/[id]/schedule/page.tsx`.
- [ ] Update booking page parsing in `src/app/(auth)/places/[placeId]/book/page.tsx`.
- [ ] Ensure URL duration stays in minutes.

### Testing

- [ ] `/courts/:id` duration updates summary and availability.
- [ ] `/courts/:id/schedule?duration=240` shows 4h.
- [ ] `/places/:id/book?duration=240` shows 4h.

---

## Final Checklist

- [ ] Lint passes.
- [ ] Build passes (optional: `TZ=UTC pnpm build`).
