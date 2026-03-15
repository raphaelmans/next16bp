# External Bookings -> Reservation Blocks Normalization (PoC) - Master Plan

## Overview

Create a developer-only CLI proof of concept that converts external booking exports into Kudoscourts' reservation-block shape.

Supported inputs:
- Calendar export: `.ics`
- Spreadsheet export: `.csv` / `.xlsx`

The script uses a **single AI call** (Vercel AI SDK + OpenAI `gpt-5.2`) to produce a **mapping spec** (column/field mapping + parsing hints). It then applies that spec deterministically across the full dataset to output a list of reservation blocks.

This PoC intentionally avoids DB writes and avoids mapping to `courtId`. Output uses `resourceId` (stable IDs for detected courts/resources) and provides a `resources[]` list for mapping later.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/66-bookings-import/` (US-66-04) |
| Cutover Context | `agent-contexts/01-05-rules-exceptions-cutover.md` |
| Court block schema | `src/shared/infra/db/schema/court-block.ts` |
| Script patterns | `scripts/import-curated-courts.ts` |
| AI SDK docs | https://vercel.com/docs/ai-sdk |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Script scaffolding + schemas | 1A | Yes |
| 2 | Deterministic parsing (CSV/XLSX/ICS) | 2A, 2B | Yes |
| 3 | AI mapping spec + deterministic normalization | 3A | Partial |
| 4 | Examples + QA + hardening | 4A | No |

---

## Module Index

### Phase 1

| ID | Module | Plan File |
|----|--------|----------|
| 1A | `scripts/normalize-data.ts` scaffolding + Zod contracts | `69-01-normalize-data-script.md` |

### Phase 2

| ID | Module | Plan File |
|----|--------|----------|
| 2A | CSV/XLSX parsing into neutral tabular dataset | `69-01-normalize-data-script.md` |
| 2B | ICS parsing + RRULE expansion into neutral event dataset | `69-01-normalize-data-script.md` |

### Phase 3

| ID | Module | Plan File |
|----|--------|----------|
| 3A | AI mapping spec (1 call) + deterministic normalization to reservation blocks | `69-01-normalize-data-script.md` |

### Phase 4

| ID | Module | Plan File |
|----|--------|----------|
| 4A | CLI UX, examples, and sanity tests | `69-01-normalize-data-script.md` |

---

## Dependencies Graph

```
Phase 1 ───────► Phase 2 ───────► Phase 3 ───────► Phase 4
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Output target | Reservation blocks only | Matches cutover model (rules + exceptions) and the immediate goal (prevent double-booking) |
| Court identity (PoC) | `resourceId` + `resources[]` | Avoids DB coupling and allows multi-court exports without having court IDs |
| AI usage | Mapping spec only (single call) | Minimizes token usage and enables deterministic processing + repeatability |
| Time granularity (PoC) | Hour-aligned blocks only | Matches the 60-minute availability step and current block constraints; avoids ambiguous partial-hour blocking |
| Re-runs without AI cost | `--mapping-file` / `--no-ai` | Lets dev iterate on parsing and normalization without paying again |
| Error handling | Best-effort: blocks + errors | Optimizes iteration; mirrors eventual UI review flow |

---

## Document Index

| Document | Description |
|----------|-------------|
| `69-00-overview.md` | This file |
| `69-01-normalize-data-script.md` | Single-script PoC design (CLI, schemas, AI mapping, parsing, normalization) |
| `69-99-deferred.md` | Explicitly out of scope items |
| `bookings-import-normalization-poc-dev1-checklist.md` | Dev checklist |

---

## Success Criteria

- [ ] `pnpm script:normalize-data -- --path <file>` prints a single JSON payload to stdout
- [ ] Output validates against a Zod schema (blocks + resources + errors)
- [ ] Multi-court inputs produce `resources[]` with stable `resourceId`s
- [ ] All emitted blocks are hour-aligned (minute 0; duration multiple of 60)
- [ ] Sports are detected best-effort (explicit column or keyword inference)
- [ ] `--mapping-file` allows reruns with zero AI calls
- [ ] `pnpm lint` passes
