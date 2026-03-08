# Design: Venue Submission Multi-Sport

## DTO Changes
- New `CourtEntrySchema`: `{ sportId, count }` with unique sportId refinement
- `SubmitCourtInputSchema`: replace `sportId` field with `courts: CourtEntry[]`

## Service Changes
- `CourtSubmissionService` gains `CourtRepository` dependency
- In transaction: iterate courts array, create court records with sequential labels
- Labels: "Court 1", "Court 2", ..., "Court N" across all sports

## Repository Changes
- `listAll` enhanced to JOIN court + sport tables
- Returns `courts: { sportName, count }[]` per submission for admin UI

## Form Changes
- `useFieldArray` for dynamic sport rows
- Each row: sport dropdown (filtered) + count number input + remove button
- "Add Sport" button appends new row

## Copy Changes
- All user-facing: "court" -> "venue"
- Error messages updated
- Admin UI: badges showing "Basketball x3, Tennis x2"
