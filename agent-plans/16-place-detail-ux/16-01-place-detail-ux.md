# Phase 1: Gallery-first UX improvements

**Dependencies:** None  
**Parallelizable:** Yes

---

## Objective

Keep the photo gallery as the first element but guide users to booking controls via overlay CTA, sticky summary, and section jump links.

---

## Module 1A: Gallery overlay + guided booking summary

**Reference:** `16-00-overview.md`

### UI Layout

```
[Gallery (hero)]  [Booking summary (sticky)]
  └─ Overlay CTA → scroll to Times

Booking controls below gallery
```

### Implementation Steps

1. Add overlay CTA to `PhotoGallery` main image.
2. Make booking summary CTA guide users to Date/Times when selection is missing.
3. Add section jump links (Sport/Court/Duration/Times).
4. Adjust gallery aspect ratios to reduce height on desktop.
5. Add scroll-mt offsets to target sections.

### Testing Checklist

- [ ] Overlay CTA scrolls to “Available start times”.
- [ ] Summary CTA scrolls to date/time when missing.
- [ ] No lightbox open when CTA clicked.

---

## Phase Completion Checklist

- [ ] UX improvements implemented in place detail page.
- [ ] Lint/build pass.
