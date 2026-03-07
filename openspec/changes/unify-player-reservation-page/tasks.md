## Tasks

- [x] Finalize the OpenSpec artifacts for `unify-player-reservation-page`
- [x] Remove `/reservations/[id]/payment` and make `/reservations/[id]` the only player reservation route
- [x] Update the reservation route boundary to parse and pass the initial `step` query state
- [x] Refactor the player reservation feature into one canonical page shell that renders overview and inline payment states from the same route
- [x] Keep the page shell and section layout consistent across loading, overview, payment, and terminal states to avoid layout flicker
- [x] Add a typed reservation page step model and `nuqs` handling for `?step=payment`, including deterministic normalization for invalid status and step combinations
- [x] Update booking success navigation, player CTAs, login redirects, and reservation link helpers to use `/reservations/[id]` with optional `?step=payment`
- [x] Reuse the existing payment proof upload and payment-marking mutations from the canonical route without route hops after submission
- [x] Ensure linked/group payment is handled on the canonical reservation page
- [x] Retarget reservation warmup and prefetch behavior to the canonical reservation detail flow
- [x] Add a reservation detail route loading state for the unified player page
- [x] Enforce player ownership on reservation detail reads
- [ ] Add or update tests for canonical path generation, step normalization, post-booking navigation, inline payment behavior, linked payment behavior, and player ownership enforcement
- [x] Run `pnpm lint` after implementation
