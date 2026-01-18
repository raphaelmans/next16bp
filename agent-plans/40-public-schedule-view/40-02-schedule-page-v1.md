# Phase 2: Detailed Schedule Page v1

**Dependencies:** Phase 1 complete
**Parallelizable:** Partial

---

## Objective

Implement a new public schedule view that shows availability per court in a denser layout and still funnels into the existing checkout route.

---

## Module 2A: Schedule page UI + query param sync + reserve navigation

### URL State

Use query params (nuqs) to persist and share:

- `date`: `yyyy-MM-dd` (place-local day key)
- `sportId`: UUID
- `mode`: `any` | `court` (v1 can force `court` internally if needed)
- `courtId`: UUID (optional; used for filtering/highlight)
- `duration`: number (60/120/180)
- `startTime`: ISO string (optional; used for highlighting)

### Data fetching

- Fetch place details via `usePlaceDetail({ placeId })` (placeId is the route param id).
- Determine courts for selected sport:
  - Filter `place.courts` by `sportId`.
  - Prefer active courts.

- Fetch availability for each active court in parallel:
  - `trpc.useQueries((t) => courts.map((court) => t.availability.getForCourt({ courtId: court.id, date: dateIso, durationMinutes })))`

### UI Layout (ASCII)

```
┌───────────────────────────────────────────────────────────────┐
│ Title: "Schedule"  [Back to details]                          │
│ Sport tabs / ToggleGroup                                       │
│ Duration chips (60/120/180)         Date picker                │
├───────────────────────────────────────────────────────────────┤
│ Scrollable lanes (per court)                                   │
│                                                               │
│ Court 1   [time slots grid]                                    │
│ Court 2   [time slots grid]                                    │
│ Court 3   [time slots grid]                                    │
│ ...                                                           │
└───────────────────────────────────────────────────────────────┘
```

### Slot interaction

- Clicking a slot sets `selectedCourtId` and `selectedStartTime` in URL.
- Primary action (button) triggers the same checkout navigation as the detail page:
  - Destination: `${appRoutes.places.book(placeId)}?startTime=...&duration=...&sportId=...&mode=court&courtId=...`
  - If not authenticated: `appRoutes.login.from(appRoutes.courts.schedule(placeId) + "?" + params)`

### Design system alignment

- Teal only for primary action ("Continue to review" / "Reserve").
- Accent/orange for links and interactive secondary controls.
- Cards: rounded-xl, border-border/60, subtle shadow.

---

## Testing Checklist

- [ ] Direct-load a schedule URL with params and verify state initializes.
- [ ] Switch sport/duration/date and verify URL updates and availability refetches.
- [ ] Select a slot and proceed; lands on booking step 2.
- [ ] Guest flow redirects to login and returns to schedule page.
