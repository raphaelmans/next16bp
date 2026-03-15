# Phase 4A - Client Multi-File UI

## Goal

Allow owners to upload up to 3 files (mixed), then review a merged draft with provenance.

---

## Shared / Contract

- [ ] Confirm upload contract uses `files[]` (repeatable form-data field).
- [ ] Confirm review page uses `listSources(jobId)` to resolve provenance.

---

## Server / Backend

- [ ] N/A (no new server work; relies on Phase 2 + Phase 3)

---

## Client / Frontend

### Upload page

- Update: `src/app/(owner)/owner/import/bookings/page.tsx`

Changes:
- Replace single `selectedFile` with `selectedFiles: File[]`.
- Drop source-type selector (or make it optional UI-only; not sent).
- Dropzone:
  - `maxFiles: 3`
  - `multiple: true`
  - `accept`: union of all supported formats
- UI:
  - list selected files (name, size, inferred type icon)
  - remove file per row
  - show "Up to 3 files" helper text

FormData:
- `files` appended multiple times.

### Review page

- Update: `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx`

Changes:
- Add query: `bookingsImport.listSources`.
- Show “Attached files” list (name, type, size).
- Add a table column “Source”:
  - show `<fileName> #<sourceLineNumber>`
  - fallback: show job `fileName` if sources unavailable

Normalize controls:
- If any sourceType=image:
  - show only AI normalize
  - keep confirm dialog
- Else:
  - show both deterministic parse and AI normalize
  - AI normalize button disabled when venue AI already used

---

## ASCII Mock (Review)

Attached Files
- 01.csv (CSV, 120KB)
- 02.xlsx (XLSX, 480KB)
- 03.png (Screenshot, 2.1MB)

Actions
- [Use AI (one-time)]  [Parse files (disabled when screenshot exists)]

Rows
| # | Source           | Court | Start | End | Reason | Status |
| 1 | 01.csv #12       | ...   | ...   | ... | ...    | VALID  |
| 2 | 03.png #5        | ...   | ...   | ... | ...    | ERROR  |
