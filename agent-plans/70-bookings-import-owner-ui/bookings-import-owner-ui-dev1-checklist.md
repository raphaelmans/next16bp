# Bookings Import Owner UI - Dev 1 Checklist

**Focus Area:** Owner import landing page + dropzone UX  
**Plan:** `agent-plans/70-bookings-import-owner-ui/70-00-overview.md`

---

## Phase 1: Page scaffolding

- [x] Add owner route `src/app/(owner)/owner/import/bookings/page.tsx`
- [x] Add venue selector (place list query) + required gating
- [x] Add step indicator (Step 1 of 4)

## Phase 2: Dropzone

- [x] Add `react-dropzone` and implement a dropzone component
- [x] Enforce `maxFiles=1` and source-specific `accept`
- [x] Render `fileRejections` inline with clear next steps
- [x] Add a remove/replace action for the selected file

## Phase 3: Wiring

- [x] Wire upload to server draft endpoint
- [x] Add one-time AI warning UI + disabled state after use

## Phase 4: QA

- [x] Mobile check (small viewport)
- [x] Keyboard navigation + focus rings
- [x] Error states (wrong type, too large, multiple files)
