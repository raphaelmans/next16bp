# Phase 3: Review/Edit UI

**Dependencies:** Phase 1 complete; Phase 2 provides rows  
**Parallelizable:** Partial  
**User Stories:** US-66-01, US-66-02, US-66-03

---

## Objective

Provide an owner UI to review and correct the imported bookings draft before commit.

---

## Route

- `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx`

Upload page (`/owner/import/bookings`) should redirect here after `createDraft` once `getJob` exists.

---

## UI Layout (Proposed)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Import Bookings - Review                                                     │
│ Venue: <name>    Source: <type>    Rows: 128    Errors: 12                   │
├───────────────────────────────────────────────┬──────────────────────────────┤
│ Rows (filter: All / Errors / Unmapped)        │ Actions                      │
│ ┌───────────────────────────────────────────┐ │ - Run AI normalize (once)     │
│ │ Court | Start | End | Reason | Status     │ │ - Re-run deterministic parse  │
│ │ ... (table)                               │ │ - Discard job                 │
│ └───────────────────────────────────────────┘ │                              │
│ [Edit row] [Delete row]                       │ Commit                        │
│                                               │ [Commit valid rows]           │
└───────────────────────────────────────────────┴──────────────────────────────┘
```

---

## Row Editing

Editing should be explicit (dialog/sheet), not inline-first, to keep complexity down.

Editable fields:

- Court (select)
- Start time (datetime)
- End time (datetime)
- Reason/label (text)

On save:

- Call `bookingsImport.updateRow`
- Recompute validation errors server-side and return updated row

---

## Filtering + Status

Statuses:

- `OK` (no errors)
- `ERROR` (blocking)
- `WARNING` (non-blocking, if any are defined)

Default view: show all rows; provide quick filters:

- Errors
- Unmapped courts
- Duplicates

---

## AI Usage UX

- Always show current AI status for the venue (available / used at).
- If available: show a destructive-leaning confirmation dialog before running AI (one-time).
- If used: disable AI action and guide user to manual review.

---

## Implementation Steps

1. Create review page route with job header + skeleton loading.
2. Add queries: `getJob`, `listRows`, `aiUsage`.
3. Build table using shadcn `Table` components.
4. Add row edit dialog and wire to `updateRow`.
5. Add delete flow and wire to `deleteRow`.
6. Add filters and counts (client-side filtering OK for MVP; paginate later).
