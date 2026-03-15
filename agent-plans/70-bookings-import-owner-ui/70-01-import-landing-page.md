# Phase 1-2: Import Landing Page + Dropzone

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-66-05

---

## Objective

Implement the owner-facing page that gathers import inputs (place + source type + file) with a high-confidence UX:

- Forced source selection
- Drag-and-drop upload (react-dropzone)
- Inline validation + recovery
- Clear step/progress indicator

---

## Route + IA

Recommended route (owner-only):

- `src/app/(owner)/owner/import/bookings/page.tsx`

This route should allow selecting a venue (place) on the page, rather than encoding place in the URL.

---

## UI Layout (Bento)

Use a 2-column bento layout on desktop and 1-column stacked on mobile.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Import Existing Bookings                                                     │
│ Prevent double-booking by importing already-booked times.                    │
├───────────────────────────────────────────────┬──────────────────────────────┤
│ Step 1 of 4: Upload                            │ How It Works                 │
│                                                │ - Choose source + upload      │
│ [ Venue ▼ ]                                    │ - AI normalizes once/venue    │
│                                                │ - Review + fix errors         │
│ Source Type (required)                         │ - Commit blocks               │
│ ( ) ICS  ( ) CSV  ( ) XLSX  ( ) Screenshot     │                              │
│                                                │ Constraints                   │
│ Dropzone                                       │ - Hour-aligned only (minute 0)│
│ ┌───────────────────────────────────────────┐  │ - Screenshot assumes 1 hour   │
│ │ Drag & drop or click to select            │  │ - AI can run once per venue   │
│ │ (shows accepted extensions)               │  │                              │
│ └───────────────────────────────────────────┘  │                              │
│ Inline errors (file type, size, too many)      │                              │
│                                                │                              │
│ [Continue]                                     │                              │
└───────────────────────────────────────────────┴──────────────────────────────┘
```

---

## Dropzone Requirements (react-dropzone)

Use `useDropzone` with:

- `maxFiles: 1`
- `multiple: false`
- `maxSize`: set a conservative limit (e.g., 20MB) and surface a friendly error
- `accept`: depends on source selection

### Accept mapping

| Source | Accept |
|--------|--------|
| ICS | `{ "text/calendar": [".ics"] }` |
| CSV | `{ "text/csv": [".csv"], "application/csv": [".csv"] }` |
| XLSX | `{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] }` |
| Screenshot | `{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] }` |

### Visual states

- Use `isDragActive`, `isDragAccept`, `isDragReject` to drive border + background changes.
- Keep layout stable (no scale transforms that cause reflow).

### Validation UX

- Show `fileRejections` errors directly under the dropzone (inline).
- Provide a "Remove" action to recover quickly.

---

## Interaction Details

- Progress indicator: Step indicator (UX guideline: users should see progress for multi-step flows).
- Source selection required before enabling dropzone.
- If AI is already used for the selected venue: show a callout explaining the constraint (AI action disabled, but upload + manual review remain).

---

## Accessibility

- Dropzone is keyboard-accessible (tab to upload, enter/space to open file picker).
- Visible focus ring using `--ring` token.
- Errors announced near the field; do not rely on color alone.
