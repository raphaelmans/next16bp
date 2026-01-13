# Phase 4: Cleanup and Validation

**Dependencies:** Phases 1-3 complete  
**Parallelizable:** No  
**User Stories:** US-13-01 (verification)  
**Status:** Pending

---

## Objective

Remove the deprecated integration surface and validate the application compiles, lints, and builds with the new canonical hook usage.

---

## Modules

### Module 4A: Cleanup deprecated APIs

#### Implementation Steps

1. Remove unused exports from `src/trpc/client.ts` (e.g. `useTRPC`, `TRPCProvider`, `useTRPCClient`) once all call sites are migrated.
2. Remove unused helper code and imports tied to the old integration.
3. Remove deprecated dependencies (if no longer used):
   - `@trpc/tanstack-react-query`
4. Ensure no call sites import removed symbols.

---

### Module 4B: Validation

#### Commands

- `pnpm lint`
- `pnpm build` (also run `TZ=UTC pnpm build` to catch timezone regressions)

#### Manual smoke checks

- Owner court create/setup pages load without runtime errors
- Reservation/payment flows fetch data correctly
- Upload endpoints still work (payment proof / avatars / org logo) if applicable

---

## Phase Completion Checklist

- [ ] No references remain to deprecated integration
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
