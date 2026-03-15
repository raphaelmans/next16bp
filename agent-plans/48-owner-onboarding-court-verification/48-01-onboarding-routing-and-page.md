# Phase 1: Onboarding Redirects + One-Time Court Page

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-02-08

---

## Objective

Implement the simplified onboarding sequence:

`Place created -> One-time court creation -> Place verification`

without changing the existing court setup wizard flow.

---

## Module 1A: Onboarding Redirect Wiring

### Scope

- Update place creation success redirect to the new one-time court creation route.
- Add a route helper for `/owner/places/{placeId}/courts/new`.

### Files (Expected)

- `src/shared/lib/app-routes.ts`
- `src/app/(owner)/owner/places/new/page.tsx`

### Flow Diagram

```text
/owner/places/new
    |
    | submit PlaceForm (success)
    v
/owner/places/{placeId}/courts/new
```

---

## Module 1B: One-Time Court Creation Page

### Scope

- Replace the current not-found stub route with a functional page.
- Page behavior:
  - Create court (details only)
  - Cancel -> courts list
  - Success -> verification

### Files (Expected)

- `src/app/(owner)/owner/places/[placeId]/courts/new/page.tsx`

### UI Layout (Sketch)

```text
Step 2 of 3  Add a Court
Create at least one court for this venue. Next: verification.

┌──────────────────────────────────────────────────────────────┐
│ Court Details                                                │
│  Place (locked): {place.name} · {place.city}                 │
│  Sport: [select]                                             │
│  Court Label: [text]                                         │
│  Tier Label: [text] (optional)                               │
│                                                              │
│ [Cancel]                                [Create & Continue]  │
└──────────────────────────────────────────────────────────────┘
```

### Flow Diagram

```text
/owner/places/{placeId}/courts/new
    |
    | submit CourtForm (success)
    v
/owner/verify/{placeId}
```

### Notes

- The place selector must be disabled/locked.
- This route always redirects to verification after creating a court.
- Do not add schedule/pricing/slot steps here.
- Do not alter the existing wizard route (`/owner/places/{placeId}/courts/setup`).

---

## Implementation Steps

1. Add `appRoutes.owner.places.courts.new(placeId)` helper.
2. Update `/owner/places/new` success redirect to use the new helper.
3. Implement `/owner/places/[placeId]/courts/new` page:
   - Query place by id
   - Query sports
   - Render `CourtForm` with place locked
   - On success: redirect to `appRoutes.owner.verification.place(placeId)`
   - On cancel: redirect to `appRoutes.owner.places.courts.base(placeId)`
4. Ensure standard owner chrome (sidebar/navbar/logout) matches other owner pages.

---

## Testing Checklist

- [ ] Create place -> redirected to `/owner/places/{placeId}/courts/new`.
- [ ] Create court -> redirected to `/owner/verify/{placeId}`.
- [ ] Cancel -> redirected to `/owner/places/{placeId}/courts`.
- [ ] Refresh on `/owner/places/{placeId}/courts/new` keeps page usable.
- [ ] `pnpm lint`.
- [ ] `pnpm build`.
