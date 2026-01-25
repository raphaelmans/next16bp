# Bookings Import Review + Commit - Master Plan

## Overview

Implement the remaining owner bookings import flow after upload:

- Persist an import job (draft) so it can be resumed
- Normalize the uploaded file into draft rows (AI is one-time per venue)
- Provide a manual review/edit UI
- Commit valid rows into court blocks to prevent double-booking

This plan covers US-66-01, US-66-02, and US-66-03.

### Completed Work (as of 2026-01-26)

- End-to-end owner flow implemented: upload -> review -> normalize -> edit -> commit -> discard
- One-time AI constraint enforced and surfaced in the UI
- Commit is idempotent and overlap-safe (checks blocks + reservations)
- Validation: `pnpm build` and `TZ=UTC pnpm build` pass

Known limitation:

- Screenshot (`image`) normalization is deferred; deterministic parsing covers ICS/CSV/XLSX

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/66-bookings-import/` |
| Upload/Wiring Plan | `agent-plans/70-bookings-import-owner-ui/70-00-overview.md` |
| Normalization PoC | `agent-plans/69-bookings-import-normalization-poc/69-00-overview.md` |
| Court Blocks | `agent-plans/67-owner-court-blocks/67-00-overview.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Draft persistence + resume APIs | 1A, 1B | Yes |
| 2 | Normalization pipeline (server) | 2A | Partial |
| 3 | Review/edit UI | 3A | Partial |
| 4 | Commit to court blocks + results | 4A | No |
| 5 | QA + polish | 5A | No |

---

## Module Index

### Phase 1

| ID | Module | Plan File |
|----|--------|----------|
| 1A | DB schema + repositories for import jobs/rows | `71-01-draft-persistence-and-resume.md` |
| 1B | tRPC endpoints: get/list/resume/discard | `71-01-draft-persistence-and-resume.md` |

### Phase 2

| ID | Module | Plan File |
|----|--------|----------|
| 2A | Normalize draft (AI once/venue) + store rows/errors | `71-02-normalization-pipeline.md` |

### Phase 3

| ID | Module | Plan File |
|----|--------|----------|
| 3A | Review/edit page (grid, row editor, validation summary) | `71-03-review-edit-ui.md` |

### Phase 4

| ID | Module | Plan File |
|----|--------|----------|
| 4A | Commit valid rows to `court_block` and show results | `71-04-commit-blocks.md` |

### Phase 5

| ID | Module | Plan File |
|----|--------|----------|
| 5A | QA checklist, edge cases, accessibility | `71-05-qa.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Persisting drafts | DB-backed import job + rows | Required for resume, review UI, and idempotent commit |
| Commit target | Create `MAINTENANCE` blocks (initially) | Blocks availability without pricing side effects |
| Idempotency | Store per-row commit mapping | Allows safe retries and partial success reporting |
| One-time AI | Enforced per venue (`usedAt`) | Meets US-66-01/03 constraint and prevents accidental spend |

---

## Success Criteria

- [x] Owner can resume an uploaded import draft by `jobId`
- [x] Draft rows render with per-row validation status (ok/warn/error)
- [x] Owner can edit rows (court, start/end, reason) and delete rows
- [x] Commit is blocked until no error rows remain
- [x] Commit creates blocks that prevent double-booking (overlaps rejected)
- [x] Commit reports created/skipped/failed counts and per-row reasons
- [x] AI normalization is clearly one-time per venue with explicit confirmation
