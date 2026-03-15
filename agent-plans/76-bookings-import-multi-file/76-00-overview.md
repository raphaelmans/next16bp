# Bookings Import Multi-File (Up To 3 Files) - Master Plan

## Overview

Extend the owner bookings import flow to support **up to 3 uploaded files per import job**, in **any combination** of `.ics`, `.csv`, `.xlsx`, and `.png/.jpg` screenshots.

Normalization merges all sources into one draft grid for review/edit, then commits valid rows into `court_block` records (existing behavior).

AI normalization stays **one-time per venue**, but becomes useful for **all file types**:
- For screenshots: AI vision extraction (required)
- For CSV/XLSX/ICS: AI-assisted mapping (new; based on existing CLI PoC patterns)

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Existing Plan | `agent-plans/71-bookings-import-review-commit/71-00-overview.md` |
| Screenshot Plan | `agent-plans/71-bookings-import-review-commit/71-06-screenshot-normalization.md` |
| User Story | `agent-plans/user-stories/66-bookings-import/66-01-owner-imports-existing-bookings-with-one-time-ai-normalization.md` |
| User Story (legacy upload UX) | `agent-plans/user-stories/66-bookings-import/66-05-owner-uploads-bookings-via-venue-import-landing-page.md` |
| CLI PoC (mapping patterns) | `scripts/normalize-data.ts` |

Note: this plan intentionally diverges from US-66-05 “source type selection required” by allowing mixed files and auto-detecting per file.

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Data model: multi-source files + row provenance + migration | 1A | No |
| 2 | Backend upload + source listing + discard updates | 2A | Partial |
| 3 | Normalization: merge sources + AI mapping for CSV/XLSX/ICS + image extraction | 3A | Partial |
| 4 | Client: multi-file upload UI + review UI provenance + normalize controls | 4A | Partial |
| 5 | QA: lint/build + manual flows + migration verification | 5A | No |

---

## Module Index

### Phase 1

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | DB schema + migration for multi-source imports | Dev 1 | `76-01-data-model-and-migration.md` |

### Phase 2

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Upload multiple files + list sources + discard cleanup | Dev 1 | `76-02-backend-upload-and-sources.md` |

### Phase 3

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | Normalize merged sources + AI mapping (CSV/XLSX/ICS) | Dev 1 | `76-03-normalization-ai-mapping.md` |

### Phase 4

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 4A | Owner UI: multi-file upload + review provenance + normalize UX | Dev 1 | `76-04-client-multi-file-ui.md` |

### Phase 5

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 5A | QA + cleanup | Dev 1 | `76-05-qa.md` |

---

## Workstream Scope

### Shared / Contract

- [ ] Define createDraft multi-file form contract (`files[]`, 1..3)
- [ ] Define `bookingsImport.listSources` output shape
- [ ] Define provenance fields in rows (`sourceId`, `sourceLineNumber`) and UI display rules
- [ ] Define AI mapping prompt + Zod schema boundaries for CSV/XLSX/ICS

### Server / Backend

- [ ] Add `bookings_import_source` table; backfill for existing jobs
- [ ] Update service to upload multiple files per job and store sources
- [ ] Update normalize to iterate sources and merge rows
- [ ] Implement AI mapping (CSV/XLSX/ICS) using `generateObject` + Zod schemas
- [ ] Update discard to delete all source files

### Client / Frontend

- [ ] Update upload page to accept 1..3 mixed files
- [ ] Update review page to show attached files and per-row provenance
- [ ] Normalize controls:
- [ ] If any image is present: deterministic normalize disabled; AI required
- [ ] If no images: deterministic vs AI mode available (AI gated by venue AI usage)

---

## Success Criteria

- [ ] Owner can upload 1..3 files (mixed) and normalize them into one draft grid.
- [ ] Rows show provenance (file name + source line/event number).
- [ ] Duplicate detection runs across files.
- [ ] AI mode works for CSV/XLSX/ICS (mapping) and image (vision extraction), but can only be used once per venue.
- [ ] `pnpm lint` and `TZ=UTC pnpm build` pass.
