# [00-16] Place/Court Checklists Verified

> Date: 2026-01-12
> Previous: 00-15-reservation-policies.md

## Summary

Verified the “remaining work” checklists for the v1.2 Place/Court migration and added explicit completion notes + pointers to the concrete implementation.

## Changes Made

### Documentation

| File | Change |
|------|--------|
| `agent-plans/14-place-court-migration/14-90-remaining-server.md` | Marked as verified complete and added completion notes w/ code pointers |
| `agent-plans/14-place-court-migration/14-91-remaining-client.md` | Marked as verified complete and added completion notes w/ code pointers |

## Key Decisions

- Kept `src/shared/lib/place-data.ts` in place for now since it’s no longer referenced by discovery, and deleting it would be scope creep.

## Next Steps (Optional)

- [ ] Delete `src/shared/lib/place-data.ts` if confirmed unused everywhere.
- [ ] Re-run `pnpm lint` + `pnpm build` after any cleanup changes.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
