# Validation and Parity Matrix

## Validation Gates

### Static Gate (Required)

- Run: `pnpm lint`
- Run: `pnpm lint:arch`
- Result must exit `0` before cutover (warning-level items are tracked separately).

### Strict Conformance Gate (Required)

All numeric checks must return target values before cutover:

1. `rg -n 'from "@/trpc/client"' src/features/*/api.ts` => `0`
2. `rg -n 'useUtils|useQueries' src/features/*/api.ts` => `0`
3. `rg -n '\\.[A-Za-z0-9_]+\\.use(Query|Mutation)\\(' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts'` => `0`
4. `rg -n 'createServerCaller' src/app -g '**/page.tsx' -g '**/layout.tsx'` => `0`
5. `rg -n 'from "@/components/' src/app -g '**/page.tsx' -g '**/layout.tsx'` => `0`
6. `rg -n '\\.trpc\\.' src/features` => `0`
7. `rg -n -F '["invalidate"](' src/features src/components src/app` => `0`
8. `rg -n -F '.invalidate(' src/features/*/components src/features/*/pages` => `0`
9. `find src/features -type f -path '*/server/*'` => empty
10. `rg -n 'createTrpcFeatureApi|extends TrpcFeatureApi|declare readonly .*: unknown;' src/features/*/api.ts` => `0`
11. `rg -n '\\.[A-Za-z0-9_]+\\.query\\(' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts'` => `0`
12. `rg -n '\\.[A-Za-z0-9_]+\\.mutation\\(' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts'` => `0`
13. `rg -n '\\b[A-Za-z0-9_]+\\.queries\\(' . -g 'src/features/*/hooks.ts' -g 'src/features/*/hooks/**/*.ts'` => `0`

### Build Gate (Conditional)

- `pnpm build` is optional and runs only when explicitly requested.

### Manual Gate (Required)

Execute the full parity matrix below. Any unresolved P0/P1 regression blocks release.

## Latest Execution Snapshot

- Date: `2026-02-18`
- Result: `PASS` (no unresolved P0/P1)
- Evidence: `docs/architecture-migration/client/parity-evidence-2026-02-18.md` (rerun timestamp `08:36:36 UTC`)

## Route-by-Route Parity Matrix

Use status values: `PASS`, `FAIL`, `BLOCKED`, `N/A`.

| ID | Area | Route / Surface | Scenario | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- |
| G-01 | Guest | `/` | Load homepage and core cards | Same content hierarchy and CTA behavior | P1 |
| G-02 | Guest | `/courts` | Search and filter courts | Same filtering and pagination behavior | P1 |
| G-03 | Guest | `/places/[placeId]` | Open place detail | Same sections, loading skeletons, and data accuracy | P1 |
| G-04 | Guest | `/places/[placeId]/courts/[courtId]` | Open court detail and availability | Same slot rendering and booking entry behavior | P0 |
| G-05 | Guest | `/venues/[placeId]/schedule` | View schedule route | Same data and navigation behavior | P2 |
| A-01 | Auth | `/login` | Login with valid credentials | Redirect/session behavior unchanged | P0 |
| A-02 | Auth | `/register` | Register path | Same validation and completion flow | P1 |
| A-03 | Auth | `/magic-link` | Request magic link | Success/error messages unchanged | P1 |
| A-04 | Auth | OTP flows | Request/verify/resend OTP | Same expiration/invalid code behavior | P0 |
| R-01 | Reservation | Booking route | Create reservation | Reservation created with same status transitions | P0 |
| R-02 | Reservation | Reservation detail route | Load reservation details | Same timeline, status, and payment data | P0 |
| R-03 | Reservation | Payment route | Submit payment proof | Same success and error outcomes | P0 |
| R-04 | Reservation | Reservation list | Cancel reservation | Same cancellation state and refresh behavior | P1 |
| O-01 | Owner | Owner places/courts setup routes | Create/edit place and courts | Same setup flow and validations | P0 |
| O-02 | Owner | Owner availability route | Create/update/cancel blocks | Same block and overlap behavior | P0 |
| O-03 | Owner | Owner bookings route | Review active/pending bookings | Same listing and status update behavior | P0 |
| O-04 | Owner | Owner import route | Draft/normalize/update/commit/discard | Same import lifecycle and errors | P0 |
| AD-01 | Admin | Admin claims routes | List, approve, reject claims | Same state transitions and refresh behavior | P0 |
| AD-02 | Admin | Admin verification routes | Review verification requests | Same decision flow and error handling | P0 |
| AD-03 | Admin | Admin courts routes | Create/edit/batch operations | Same submission and media flows | P1 |
| AD-04 | Admin | Admin notification tool | Trigger test notifications | Same mutation outcomes and logs | P2 |
| C-01 | Chat | Reservation chat widget | Open session and send messages | Same session auth/send behavior | P0 |
| C-02 | Chat | Unified chat interface | Claim/verification support threads | Same thread listing/send flow | P0 |
| OP-01 | Open Play | Open play list/detail | List and open detail | Same visibility and status rendering | P1 |
| OP-02 | Open Play | Join/leave/decide flows | Participant lifecycle actions | Same decision and status updates | P0 |

## Error / Loading / Empty State Checklist

For each tested surface above, verify all applicable states:

1. Loading state appears with expected skeleton/spinner behavior.
2. Empty state appears with expected copy and CTA behavior.
3. Validation errors map to expected field/root messages.
4. Transport errors show normalized and user-safe messaging.
5. Success states trigger expected invalidation/refresh.
6. Post-mutation navigation ordering remains correct.

## Parity Log Template

For each scenario executed, capture:

- Scenario ID
- Tester
- Date/time
- Environment
- Result (`PASS`/`FAIL`/`BLOCKED`)
- Notes
- Regression severity (`P0`, `P1`, `P2`)
- Evidence link/path (video, screenshot, HAR, or console snapshot)

## Architecture Gate Log Template

Capture each architecture gate run before sign-off:

- Run timestamp
- Branch + commit SHA
- `pnpm lint` result
- `pnpm lint:arch` result
- Numeric command outputs (commands 1-13 above)
- Owner initials

## Release-Blocking Criteria

Release is blocked if any of the following are true:

1. `pnpm lint` fails.
2. `pnpm lint:arch` fails.
3. Any strict conformance numeric check is not at target.
4. Any `P0` scenario fails.
5. Any `P1` scenario fails without approved waiver.
6. Any critical owner/admin/chat flow lacks test evidence.
7. Error/empty/loading checks are incomplete for high-risk flows.

## Cutover Sign-off

Required sign-offs:

- Frontend owner
- Product/QA representative
- Release owner

Sign-off requires attached parity logs and final blocker review.
