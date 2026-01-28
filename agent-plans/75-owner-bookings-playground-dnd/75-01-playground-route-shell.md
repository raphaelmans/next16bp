# Phase 1: Playground Route + Layout Shell

**Dependencies:** existing owner auth + court blocks UI is live (`agent-plans/67-owner-court-blocks/`)  
**Parallelizable:** Yes (frontend layout can start before drag/drop)  
**User Stories:** 05-03, 05-04, 66-02

---

## Objective

Create an owner “Bookings Playground” route that centralizes:

- Venue selection
- Court selection
- Month navigation (date picker)
- Day timeline editor surface (non-DnD in this phase)

The output of this phase is a stable layout and URL contract that Phase 2 can layer DnD onto.

---

## Route + URL Contract

Recommended route:

- `/owner/bookings`

Query params (via `nuqs`):

- `placeId` (string)
- `courtId` (string)
- `dayKey` (string, `yyyy-MM-dd`, in place time zone)
- `view` (string enum: `month` | `day`)
- `jobId` (optional, string) -> enables import overlay mode in Phase 4

---

## Layout (Bento)

3-pane bento layout optimized for desktop:

- Left: Month nav calendar + venue/court selectors
- Center: Day timeline (hour grid + blocks)
- Right: Inspector (selected block details + quick actions)

ASCII wireframe:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Venue ▼  Court ▼  Date ▼   View: Month ▾  Day ▾   TZ: Asia/Manila             │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────┐  ┌──────────────────────────────────┐ ┌──────────┐ │
│ │ Month nav              │  │ Day Timeline                     │ │ Inspector│ │
│ │ (Calendar)             │  │ (hour grid + blocks)             │ │ (context)│ │
│ └───────────────────────┘  └──────────────────────────────────┘ └──────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Wiring

Minimum required queries/mutations:

- `trpc.courtBlock.listForCourtRange` for the selected day range
- `trpc.availability.getForCourtRange` optionally for “availability context” (can be deferred)

Time zone:

- Always display and edit in `place.timeZone`.
- Convert to UTC ISO strings for API inputs (use `toUtcISOString` from `src/shared/lib/time-zone.ts`).

---

## Workstreams

### Shared / Contract

- [ ] Document the query param contract (placeId/courtId/dayKey/view/jobId).

### Server / Backend

- [ ] N/A (existing endpoints).

### Client / Frontend

- [ ] Add `/owner/bookings` page.
- [ ] Implement venue + court selectors (reuse existing owner hooks where possible).
- [ ] Add month calendar navigation (reuse `AvailabilityMonthView` patterns).
- [ ] Render day blocks list and basic “Add maintenance / Add walk-in” actions (existing dialogs can be reused).
