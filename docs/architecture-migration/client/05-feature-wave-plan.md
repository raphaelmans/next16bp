# Feature Wave Plan (Big-Bang Delivery on One Integration Branch)

## Branching and Merge Model

- Integration branch: `codex/frontend-architecture-overhaul`.
- Work is delivered in three sequential waves (A -> B -> C).
- Each wave can use internal sub-PRs but must merge back into the same integration branch.
- Production release happens once at final cutover.

## Shared Wave Rules

For every feature in every wave:

1. Add endpoint-scoped `api.ts` contract (`I<Feature>Api`, class, factory, deps type) with business methods only.
2. Standardize server-state hooks naming (`useQuery*`, `useMut*`, `useMod*`).
3. Move direct tRPC usage out of pages/presentation into feature hooks/adapters.
4. Keep invalidation ownership in mutation hooks and `useMod*` coordinators (no component/page ownership at cutover).
5. Standardize error normalization to client-safe `AppError` shape.
6. Run feature-specific parity checks and log outcomes.

## Wave A (Low-Medium Coupling)

### Features

- `auth`
- `contact`
- `home`
- `notifications`
- `organization`

### Entry Criteria

- Baseline audit accepted.
- Route extraction plan initialized for touched files.
- Shared error contract scaffolded in `src/common/errors`.

### Step-by-Step Tasks

1. Create endpoint-scoped `api.ts` for each Wave A feature (no pass-through namespace exposure).
2. Add `api.runtime.ts` wiring per feature.
3. Refactor `hooks.ts` to align naming and API boundaries.
4. Remove direct tRPC usage from Wave A pages/components.
5. Migrate `src/app/home-*.tsx` modules into `src/features/home/components`.
6. Validate auth/session invalidation and logout cache-clear behavior parity.
7. Execute Wave A smoke checklist.

### Exit Criteria

- Wave A features expose standardized API contracts.
- No direct tRPC usage remains in Wave A pages/presentation components.
- `pnpm lint` passes.
- Wave A smoke checks pass without unresolved parity regressions.

### Regression Checklist

- Login, register, magic-link, OTP request/verify/resend
- Logout and cache/session reset behavior
- Home dashboard widgets and quick actions
- Notification bell and web-push settings
- Organization form create/update paths

## Wave B (Medium Coupling)

### Features

- `discovery`
- `open-play`
- `reservation`

### Entry Criteria

- Wave A completed and stabilized.
- Route extraction for discovery clients prepared.

### Step-by-Step Tasks

1. Add API contracts for all three features.
2. Normalize discovery data adapters and filter/query behavior into feature hooks.
3. Move route-local discovery client modules out of `src/app`.
4. Refactor open-play query/mutation flows to named `useQuery*` / `useMut*` hooks.
5. Refactor reservation mutation flows and payment-proof flows with explicit invalidation helpers.
6. Remove direct tRPC in discovery/reservation presentation components.
7. Execute Wave B smoke checklist.

### Exit Criteria

- Discovery/open-play/reservation hooks follow naming and SRP rules.
- Route boundaries delegate to feature components with typed props.
- No unresolved parity regressions for booking and payment flows.

### Regression Checklist

- Public browse/search/filter/map/list/detail
- Place detail and court detail scheduling/availability rendering
- Reservation create/cancel/payment/proof/upload/status
- Open-play list/detail/create/join/leave/decide/close/cancel
- Contact and support widgets shown in related routes

## Wave C (High Coupling / Highest Risk)

### Features

- `owner`
- `admin`
- `chat`
- `support-chat`

### Entry Criteria

- Wave B completed.
- High-risk playbooks approved.
- Compatibility aliases are inventoried and assigned explicit deletion tasks before cutover.

### Step-by-Step Tasks

1. Split oversized owner/admin hooks into domain-specific hook modules.
2. Introduce owner/admin API contract layers incrementally (bookings, courts, places, claims, verification).
3. Remove direct tRPC calls from owner/admin pages into feature query adapters.
4. Refactor chat widgets/interfaces to consume feature hooks only.
5. Move admin route server action module out of `src/app`.
6. Apply invalidation helper standardization across owner/admin mutations.
7. Execute Wave C smoke checklist.

### Exit Criteria

- Owner/admin/chat flows use standardized boundaries.
- High-risk files are reduced and split by SRP.
- No unresolved P0/P1 parity regressions in owner/admin/chat critical flows.

### Regression Checklist

- Owner place/court create/edit/setup/hours/pricing/availability
- Owner bookings board, maintenance/walk-in block flows, guest booking
- Owner bookings import draft/normalize/update/commit/discard
- Admin courts list/edit/new/batch, claims, verification, notification tools
- Reservation chat, support chat, open-play chat session and message flows

## Wave-Level Quality Gate Template

For each wave, require:

1. `pnpm lint` pass.
2. `pnpm lint:arch` pass for that wave.
3. Manual smoke checklist pass for that wave.
4. Updated migration notes in PR description:
- changed files
- extracted route modules
- removed direct transport calls
- parity validation results

## Final Pre-Cutover Criteria

All waves complete with:

- no direct tRPC calls in pages/presentation components
- extracted route-local modules from `src/app`
- strict FeatureApi endpoint-scoped contracts across all 13 features
- no namespace `.query/.mutation/.queries` hook calls
- full parity matrix pass in `07-validation-and-parity-matrix.md`
