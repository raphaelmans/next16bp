## 1. OpenSpec Artifacts

- [x] 1.1 Create the `coach-entry-points-and-cross-discovery` change scaffold under the default spec-driven workflow
- [x] 1.2 Author proposal, design, and capability spec artifacts for coach entry points and cross-discovery

## 2. Shared Coach Entry Logic

- [x] 2.1 Add a client-safe helper that translates court discovery state into coach discovery destinations with shared-filter parity only
- [x] 2.2 Add unit coverage for the helper’s base route, location route, and query-preservation behavior

## 3. Public Entry Surfaces

- [x] 3.1 Update the public landing navbar to include a persistent `Find Coaches` entry on desktop and mobile
- [x] 3.2 Add a subtle coach helper CTA to the landing hero support links without displacing court search
- [x] 3.3 Extend the shared public footer with coach discovery and onboarding links
- [x] 3.4 Add coach cross-discovery CTAs to `/courts` results headers and empty-results states

## 4. Signed-In Re-entry

- [x] 4.1 Reuse coach setup state in public navbar auth actions to show `Coach Portal` or `Become a Coach`
- [x] 4.2 Add a matching coach-aware quick action to `/home`

## 5. Validation

- [ ] 5.1 Run `pnpm lint`
- [ ] 5.2 Manually smoke `/`, `/courts`, `/coaches`, `/home`, and `/coach/get-started` across desktop and mobile entry points
