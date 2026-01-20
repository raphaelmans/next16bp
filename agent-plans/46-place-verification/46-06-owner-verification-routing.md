# Phase 6: Owner Verification Routing

**Dependencies:** Phase 3 complete
**Parallelizable:** Yes
**User Stories:** US-19 (Place verification)

---

## Objective

Provide a dedicated owner verification route per place, replace the inline verification panel on the edit page with a CTA, and update the owner verification landing page to list places and deep-link into verification.

---

## Module 6A: Owner Verification Pages

**Scope:** Owner UI routing + CTAs

### Directory Structure

```
src/app/(owner)/owner/verify/
├── page.tsx
└── [placeId]/page.tsx
```

### UI Layout

```
/owner/verify
┌────────────────────────────┐
│ Place Verification          │
│ Description                 │
│ ┌───────────────┐           │
│ │ Place Card    │ [Verify]  │
│ └───────────────┘           │
└────────────────────────────┘

/owner/verify/:placeId
┌────────────────────────────┐
│ Verify {Place Name}         │
│ [Edit] [View Public]        │
│ ┌───────────────┐           │
│ │ Status Card   │           │
│ └───────────────┘           │
│ [PlaceVerificationPanel]    │
└────────────────────────────┘
```

### Implementation Steps

1. Add `/owner/verify/[placeId]` page using `PlaceVerificationPanel` and owner shell.
2. Replace inline `PlaceVerificationPanel` on `/owner/places/[placeId]/edit` with CTA linking to verification.
3. Update `/owner/verify` landing page to list owner places with status badges and a Verify CTA.
4. Run `pnpm lint` and `pnpm build`.

### Testing Checklist

- [ ] `/owner/verify/:placeId` loads for an owned place.
- [ ] Edit page shows CTA and no inline verification panel.
- [ ] Landing page lists places and links correctly.
- [ ] Lint/build pass.
