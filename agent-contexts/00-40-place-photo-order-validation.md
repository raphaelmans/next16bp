# [00-40] Place Photo Order Validation

> Date: 2026-01-13
> Previous: 00-39-db-reset-auth-schema.md

## Summary

Added validation to prevent duplicate place photo ordering, ensuring reorder requests cannot silently corrupt display order.

## Changes Made

### Validation

| File | Change |
| --- | --- |
| `src/modules/place/dtos/reorder-place-photos.dto.ts` | Enforced unique photo IDs in the reorder schema. |
| `src/modules/place/services/place-management.service.ts` | Added duplicate guard before updating display order. |

## Key Decisions

- Validate uniqueness in both schema and service layers to catch malformed input early and defensively.

## Next Steps (if applicable)

- [ ] Run `pnpm lint` if needed.

## Commands to Continue

```bash
pnpm lint
```
