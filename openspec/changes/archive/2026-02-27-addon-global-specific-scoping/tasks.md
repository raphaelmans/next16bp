## 1. Change A — Pricing Input Bug Fix

- [x] 1.1 In `src/features/owner/components/court-addon-editor.tsx`, update flat fee input: `value={addon.flatFeeCents != null ? addon.flatFeeCents / 100 : ""}` and `onChange` uses `Math.round(val * 100)`
- [x] 1.2 Update hourly rate input: `value={group.hourlyRateCents != null ? group.hourlyRateCents / 100 : 0}` and `onChange` uses `Math.round(val * 100)`
- [x] 1.3 Update rate column header label from `"Rate (cents/hr)"` to `"Rate (₱/hr)"` and update aria-label
- [x] 1.4 Run `pnpm lint` to verify no type errors introduced

## 2. Change B — FLAT Add-on Simplification

- [x] 2.1 In `src/lib/shared/lib/schedule-availability.ts`, move FLAT add-on processing before the segment loop: for each applied FLAT addon, add `flatFeeCents × quantity` to `totalPriceCents` once (no window matching)
- [x] 2.2 Remove `chargedFlatAddons` set and the FLAT block inside the segment loop
- [x] 2.3 In `src/features/owner/components/court-addon-editor.tsx`, conditionally render the "Schedule rules" section only when `addon.pricingType !== "FLAT"`
- [x] 2.4 Remove the `hasFlatNoWindows` warning block and its associated variable
- [x] 2.5 Update `createDefaultAddon()` so FLAT add-ons default to `groups: []`
- [x] 2.6 Update `hasBlockingIssues` validation to skip group-related checks for FLAT add-ons
- [x] 2.7 Run `pnpm lint` to verify changes

## 3. Change C — Database Schema (GLOBAL Scoping)

- [x] 3.1 Create `src/lib/shared/infra/db/schema/enums.ts` additions: `placeAddonModeEnum` (`OPTIONAL|AUTO`) and `placeAddonPricingTypeEnum` (`HOURLY|FLAT`)
- [x] 3.2 Create `src/lib/shared/infra/db/schema/place-addon.ts` with `placeAddon` Drizzle table, `PlaceAddonSchema`, `InsertPlaceAddonSchema`, and type exports
- [x] 3.3 Create `src/lib/shared/infra/db/schema/place-addon-rate-rule.ts` with `placeAddonRateRule` Drizzle table, schemas, and type exports
- [x] 3.4 Export both new schemas from `src/lib/shared/infra/db/schema/index.ts`
- [x] 3.5 Run `pnpm db:generate` to generate migration files
- [x] 3.6 Run `pnpm db:migrate` (or `pnpm db:push` for dev) to apply migrations

## 4. Change C — Backend Module (place-addon)

- [x] 4.1 Create `src/lib/modules/place-addon/errors/place-addon.errors.ts` with `PlaceAddonOverlapError`, `PlaceAddonValidationError`, `PlaceAddonCurrencyMismatchError`
- [x] 4.2 Create `src/lib/modules/place-addon/repositories/place-addon.repository.ts` with `IPlaceAddonRepository` interface and `PlaceAddonRepository` class (`findByPlaceId`, `findActiveByPlaceId`, `deleteByPlaceId`, `createOne`, `createManyRateRules`, `findRateRulesByAddonIds`)
- [x] 4.3 Create `src/lib/modules/place-addon/dtos/place-addon.dto.ts` with `GetPlaceAddonsSchema`, `SetPlaceAddonsSchema`, and DTO types
- [x] 4.4 Create `src/lib/modules/place-addon/dtos/index.ts` re-exporting the DTOs
- [x] 4.5 Create `src/lib/modules/place-addon/services/place-addon.service.ts` with `PlaceAddonConfig` type, `IPlaceAddonService` interface, and `PlaceAddonService` class (`getByPlace`, `setForPlace`) following the same ownership verification and validation pattern as `CourtAddonService`
- [x] 4.6 Create `src/lib/modules/place-addon/factories/place-addon.factory.ts` with singleton `makePlaceAddonRepository()` and `makePlaceAddonService()`
- [x] 4.7 Create `src/lib/modules/place-addon/place-addon.router.ts` with `placeAddonRouter` (`get` query, `set` mutation)
- [x] 4.8 Register `placeAddonRouter` in `src/lib/shared/infra/trpc/root.ts` as `placeAddon`
- [x] 4.9 Run `pnpm lint` to verify backend module

## 5. Change C — Pricing Engine Update

- [x] 5.1 In `src/lib/shared/lib/schedule-availability.ts`, add `venueAddons?: ScheduleAddon[]` to `computeSchedulePriceDetailed` options type
- [x] 5.2 Merge `venueAddons` into the `appliedAddons` array alongside court `addons` (GLOBAL add-ons use the same `isActive` + `mode` filter; `AUTO` GLOBAL add-ons always included, `OPTIONAL` GLOBAL add-ons require player selection)
- [x] 5.3 Propagate the same change to the `computeSchedulePrice` wrapper signature
- [x] 5.4 Identify all call sites of `computeSchedulePriceDetailed` / `computeSchedulePrice` in the codebase and update them to fetch and pass `venueAddons` from `placeAddon.getByPlace(placeId)`
- [x] 5.5 Run `pnpm lint` to verify engine changes

## 6. Change C — Owner UI

- [x] 6.1 Create `src/features/owner/hooks/place-addons.ts` with `useQueryOwnerPlaceAddons(placeId)` and `useMutOwnerSavePlaceAddons(placeId)` hooks
- [x] 6.2 Export new hooks from `src/features/owner/hooks/index.ts`
- [x] 6.3 Create `src/features/place-addon/components/place-addon-editor.tsx` (`PlaceAddonEditor`) — structurally identical to `CourtAddonEditor` but uses place add-on hooks; FLAT add-ons show no schedule rules section
- [x] 6.4 Update `src/features/owner/components/court-addon-editor.tsx`: add a read-only "Inherited from venue" section that fetches `placeAddon.get(placeId)` and displays active GLOBAL add-ons with no edit controls; section hidden when no GLOBAL add-ons exist
- [x] 6.5 Run `pnpm lint` to verify UI changes
- [x] 6.6 Pass `placeId` to `CourtAddonEditor` in court setup page
- [x] 6.7 Mount `PlaceAddonEditor` in place edit page

## 7. Change C — Player UI

- [x] 7.1 Create or update a hook (e.g. `useCombinedAddons(placeId, courtId)`) in `src/features/court-addons/` that fetches both `placeAddon.get(placeId)` and `courtAddon.get(courtId)` and returns a merged list (GLOBAL first, then SPECIFIC)
- [x] 7.2 Update player booking add-on selection UI to use the combined hook and display "(venue-wide)" badge on GLOBAL OPTIONAL add-ons
- [x] 7.3 Verify booking submission payload includes IDs from both scopes in `selectedAddonIds`
- [x] 7.4 Run `pnpm lint` to verify player UI changes

## 8. Verification

- [ ] 8.1 Owner enters `150` in flat fee input → player sees ₱150.00 in order summary (not ₱1.50)
- [ ] 8.2 Create a FLAT addon with no schedule rules → booking computes correct flat fee, no "never charged" warning
- [ ] 8.3 Create a venue-wide GLOBAL paddle rental addon → all courts show it in player booking
- [ ] 8.4 Disable a GLOBAL add-on → it disappears from all courts' booking flows immediately
- [ ] 8.5 Run `pnpm lint` across all changes
