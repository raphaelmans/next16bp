# [00-17] Optional Place Coordinates

> Date: 2026-01-12
> Previous: 00-16-place-court-checklists-verified.md

## Summary

Made latitude/longitude optional in owner place creation/edit flows and documented the change in the owner UI plan and Place/Court migration user story.

## Changes Made

### UI

| File | Change |
|------|--------|
| `src/features/owner/components/place-form.tsx` | Marked latitude/longitude labels as optional and kept submit payload optional |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/14-place-court-migration/14-03-owner-ui.md` | Added optional latitude/longitude fields to place form spec |
| `agent-plans/user-stories/14-place-court-migration/14-06-owner-creates-a-place-with-multiple-courts.md` | Noted optional coordinates in acceptance criteria + edge cases |

## Key Decisions

- Treat latitude/longitude as optional in the place creation flow to avoid blocking owners without map data.

## Next Steps (if applicable)

- [ ] Ensure DB columns for `place.latitude`/`place.longitude` are nullable in production.
- [ ] Re-run `pnpm db:push` after migrations stabilize.

## Commands to Continue

```bash
pnpm db:push
```
