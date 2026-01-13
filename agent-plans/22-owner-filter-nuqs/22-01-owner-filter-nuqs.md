# Phase 1: Owner Filter Nuqs Migration

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-04-01 (Owner dashboard filters)

---

## Objective

Replace manual URL reconciliation in owner place/court filter hooks with nuqs query state so updates merge cleanly with other query parameters.

---

## Modules

### Module 1A: Filter hooks via nuqs

**User Story:** `US-04-01`  
**Reference:** `22-01-owner-filter-nuqs.md`

#### Files

- `src/features/owner/hooks/use-owner-place-filter.ts`
- `src/features/owner/hooks/use-owner-court-filter.ts`

#### Implementation Steps

1. Swap `useSearchParams`/`router.replace` with `useQueryState`.
2. Keep localStorage writes on change.
3. Seed from localStorage when query is missing via nuqs setter.
4. Preserve optional `syncToUrl` toggle.

---

### Module 1B: Update callsites + QA

**User Story:** `US-04-01`  
**Reference:** `22-01-owner-filter-nuqs.md`

#### Files

- `src/features/owner/components/reservation-alerts-panel.tsx`
- `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx`

#### Implementation Steps

1. Pass `syncToUrl={false}` where URL sync is undesired.
2. Verify Setup Wizard navigation keeps `courtId` intact.

---

## Testing Checklist

- [ ] Navigate Setup Wizard from courts table
- [ ] URL preserves `courtId` + `step` after load
- [ ] `pnpm lint`

---

## Phase Completion Checklist

- [ ] Manual URL reconciliation removed
- [ ] Owner filters still persist selection
- [ ] No TypeScript errors
