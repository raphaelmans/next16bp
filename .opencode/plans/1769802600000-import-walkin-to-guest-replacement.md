## Plan: Import Walk-in -> Guest Replacement UI (Requirements)

### Status
Requirements capture only. Implementation deferred because parallel development may change code paths.

### Problem
Booking import should remain deterministic (import always creates walk-in-style blocks), but owners need an easy way to replace imported blocks with guest bookings so the schedule shows guest names.

### Scope
Add UI and supporting backend wiring to convert/replace an imported block (created from import commit) into a guest booking reservation for the same court/time range.

### Requirements

1. Import remains deterministic
   - Import normalization and commit does not attempt to infer guests.
   - Import commit continues to create walk-in-style blocks (same behavior as today).

2. Replace action is available only in import context
   - When in import overlay/review context (e.g., bookings studio opened with an import job), imported blocks expose a CTA: `Replace with guest booking`.
   - Imported blocks remain visibly labeled as imported until replaced.

   Minimum UI:
   - Imported badge/tag on blocks.
   - Per-block action entry point (`Replace with guest booking`).
   - “Replaced” state (guest name shown; CTA disabled).

3. Guest replacement UX
   - Clicking `Replace with guest booking` opens a guest booking panel (modal or side panel) reusing the existing guest booking form where possible:
     - Start/End: prefilled from the imported block (read-only).
     - Guest mode: select existing or create new.
     - Name: prefilled from the import row `reason/title` as a suggested guest name (editable).
     - Optional phone/email.
     - Optional notes.
     - Primary action: `Replace block`.
     - Secondary action: `Cancel`.

4. Replacement behavior (atomic from user perspective)
   - On confirm, system performs a safe replacement:
     - Create guest booking reservation for the same court/time range.
     - Only after reservation succeeds, remove/cancel the original imported block.
   - Failure behavior:
     - If reservation creation fails (overlap, validation, network), the original block remains.
     - Error is surfaced clearly (toast or inline), and user can retry.

5. Durable association + audit
   - Persist a link from the import row to the created guest booking so the UI can:
     - Show that a row/block was replaced.
     - Prevent double replacement.
     - Re-open the guest booking details.
   - Store at minimum: `reservationId`, `guestProfileId`, and `replacedAt` (exact storage to be decided during implementation).

   UI needs this association to:
   - Show replacement status on reload.
   - Prevent duplicate replacements.
   - Re-open guest booking details from the import item.

6. Bulk ergonomics (optional)
   - Provide a quick workflow to replace multiple imported blocks (e.g., next/previous imported item, or a list with per-row replace CTA).

### Sample Scenarios

1. Replace with existing guest
   - User clicks an imported block -> `Replace with guest booking`.
   - Selects existing guest.
   - Confirms replacement.
   - Reservation is created; imported block is removed; schedule shows guest name; item shows `Replaced`.

2. Replace with new guest
   - User clicks imported block -> replace.
   - Chooses `New guest`; name is prefilled from import reason/title; user edits phone/email.
   - Confirms replacement.
   - Guest profile is created; reservation is created; block removed; schedule shows guest name.

3. Failure due to overlap
   - User tries replacement.
   - Reservation creation fails.
   - Original block remains; UI shows error and lets user retry.

### User Flow (Single Replacement)

1. Import context view shows imported blocks with an `Imported` badge.
2. User clicks `Replace with guest booking`.
3. Guest panel opens with start/end prefilled (read-only) and suggested name.
4. User selects/creates guest; confirms.
5. System creates reservation; then cancels the original block.
6. UI updates to show guest name and marks item as `Replaced`.

### Constraints / Notes
- Guest bookings are reservations; walk-in/maintenance are court blocks.
- Guest booking creation must account for overlap checks; replacement flow must respect those.
- No changes to AI normalization tiers or mapping logic are required.

### Candidate Surfaces (to confirm at implementation time)
- Import review page for a job.
- Owner bookings studio import overlay (jobId context) on the timeline blocks list.

### Verification (when implemented)
- Replace single imported block with existing guest: reservation created, block removed, UI shows guest name.
- Replace single imported block with new guest: guest profile created, reservation created, block removed.
- Failure path: reservation creation fails -> original block stays.
- Reload: replaced rows show as replaced; no duplicate actions.
