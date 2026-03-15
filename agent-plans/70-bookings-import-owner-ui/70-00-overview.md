# Bookings Import Owner UI - Master Plan

## Overview

Design and implement an owner-facing bookings import landing page that allows organization admins to:

- Select a venue
- Select a source type (required; no auto-detect)
- Drag-and-drop an export file (ICS/CSV/XLSX) or calendar screenshot (image)
- Route to the appropriate normalization pipeline (AI + deterministic validation)

The page should follow the KudosCourts design system (Minimalist Bento, warm neutrals, teal primary CTA) and provide clear progress + error recovery.

### Completed Work (as of 2026-01-26)

- Route implemented: `/owner/import/bookings`
- Venue + source selection + react-dropzone upload UI implemented
- Backend wiring for draft upload and AI usage status implemented (`bookingsImport.createDraft`, `bookingsImport.aiUsage`)

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/66-bookings-import/` (US-66-01..05) |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| PoC Script Plan | `agent-plans/69-bookings-import-normalization-poc/69-00-overview.md` |
| Dropzone Docs | https://react-dropzone.js.org/ |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | UX + route scaffolding | 1A | Yes |
| 2 | Dropzone + validation | 2A | Yes |
| 3 | Import state + API wiring (draft + AI normalize) | 3A, 3B | Partial |
| 4 | QA + polish | 4A | No |

---

## Module Index

### Phase 1

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Import landing page UI + step indicator | Dev 1 | `70-01-import-landing-page.md` |

### Phase 2

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Dropzone component (react-dropzone) + source-specific accepts | Dev 1 | `70-01-import-landing-page.md` |

### Phase 3

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | Draft import state model (place + source + file) | Dev 1 | `70-02-import-state-and-wiring.md` |
| 3B | Wire to backend endpoints (draft + AI normalize + resume) | Dev 1 | `70-02-import-state-and-wiring.md` |

### Phase 4

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 4A | QA checklist, edge cases, accessibility | Dev 1 | `70-03-qa.md` |

---

## Dependencies Graph

```
Phase 1 ───────► Phase 2 ───────► Phase 3 ───────► Phase 4
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Source selection | Required (no auto-detect) | Avoids wrong routing and makes error states clearer |
| Upload UX | Drag-and-drop + click-to-select (1 file) | Familiar, fast onboarding; aligns with org admin workflows |
| Error handling | Inline + actionable recovery | UI/UX best practice; reduces support burden |
| Visual direction | Minimalist bento (design system) | Consistent with KudosCourts brand and existing UI |

---

## Success Criteria

- [x] Owner can select venue + source type and upload a file via dropzone
- [x] Dropzone validates file type/size and shows inline errors
- [x] Clear progress indicator exists for the import flow
- [x] Mobile and desktop layouts are both usable
- [x] Accessibility: keyboard upload, focus rings, readable errors
