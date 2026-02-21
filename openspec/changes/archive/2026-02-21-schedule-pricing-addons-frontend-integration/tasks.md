## 1. Frontend add-on integration foundation

- [x] 1.1 Add owner feature API support for `courtAddon.get` and `courtAddon.set` transport calls.
- [x] 1.2 Create shared frontend add-on module (`helpers`, `schemas`, `hooks`) for deterministic mapping and state handling.
- [x] 1.3 Add unit tests for shared add-on helpers/schemas and exported hook-level behavior.

## 2. Owner court add-on management UI

- [x] 2.1 Integrate add-on management section into owner court schedule/setup surfaces.
- [x] 2.2 Implement mode/type-aware add-on form controls (`OPTIONAL`/`AUTO`, `HOURLY`/`FLAT`) with actionable helper copy.
- [x] 2.3 Implement rule-window editing UX with overlap/invalid-window feedback aligned to backend validation behavior.

## 3. Player add-on selection and payload threading

- [x] 3.1 Add add-on selection state in discovery and booking flows, including URL/state persistence where applicable.
- [x] 3.2 Pass `selectedAddonIds` through availability requests and reservation create payloads.
- [x] 3.3 Ensure invalid/unavailable add-on IDs are safely filtered with user-visible guidance.

## 4. Warning and pricing breakdown UX

- [x] 4.1 Add booking summary breakdown for base amount, add-on amount, and total amount.
- [x] 4.2 Render pricing warnings as non-blocking contextual UI near booking totals/review surfaces.
- [x] 4.3 Verify warning and breakdown components remain accessible and mobile-responsive.

## 5. Verification and parity

- [x] 5.1 Run `pnpm lint` and resolve scoped issues introduced by this change.
- [x] 5.2 Run targeted unit tests including schedule pricing add-ons test suite and new frontend add-on tests.
- [x] 5.3 Execute manual smoke checks for owner and player flows to confirm frontend parity with add-on runtime behavior.
