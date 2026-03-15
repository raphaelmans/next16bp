# Phase 3: Import State + API Wiring

**Dependencies:** Phase 1-2 complete  
**Parallelizable:** Partial  
**User Stories:** US-66-01, US-66-03, US-66-05

---

## Objective

Define the owner import flow state and wire the landing page to backend endpoints so the user can progress into draft review.

This phase is about **wiring**, not about data correctness (the PoC already covers normalization correctness).

---

## State Model

The minimal client state for this page:

- `placeId`
- `sourceType`: `ics | csv | xlsx | image`
- `file`
- `uploadStatus`: idle/uploading/success/error
- `importJobId` (returned from server)
- `aiAvailable` (derived from place flag)

Prefer URL state only where useful (e.g., `?placeId=`) and keep file state in memory.

---

## Backend Endpoints (Proposed)

These are planning-level interfaces; exact shapes may evolve.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `bookingsImport.aiUsage` | query | Show whether AI is available for the venue (and when used) |
| `bookingsImport.createDraft` | mutation | Persist upload and return a `jobId` + file metadata |
| `bookingsImport.getDraft` | query | Resume draft/job metadata (future: persisted in DB) |
| `bookingsImport.normalizeWithAi` | mutation | Run one-time AI normalization per venue (future) |

---

## One-Time AI Constraint

Server should enforce a per-place lock (e.g., `place.bookings_ai_normalized_at`).

UI should:

- Show a clear one-time warning before calling AI
- Disable the AI action if already used

---

## Handoff To Review UI

After successful normalization, route to the review/edit page (future work) with:

- `importJobId`
- `placeId`

See the follow-up plan for review/edit + commit: `agent-plans/71-bookings-import-review-commit/71-00-overview.md`.
