## Context

The repo already has a public coach discovery route family, a protected coach portal, and coach onboarding/setup status queries. The gap is not missing coach functionality; it is missing entry points and weak re-entry orientation on public and signed-in surfaces that still largely frame KudosCourts as a courts-and-owners product.

This change stays additive and UI-led. It must preserve the current landing-page hierarchy, keep route boundaries thin, and avoid introducing a coach-specific visual system that competes with the existing courts-first story.

## Goals / Non-Goals

**Goals:**
- Make coaches discoverable from the public landing page and `/courts`.
- Preserve relevant location and search context when pivoting from courts to coaches.
- Give signed-in users a direct coach shortcut without redesigning portal architecture.
- Reuse existing coach routes and setup state rather than inventing new backend contracts.

**Non-Goals:**
- No dedicated coach marketing landing page.
- No coach-specific default portal or portal switcher expansion.
- No backend, schema, or authorization-model changes.
- No attempt to fix all coach onboarding gaps in this change.

## Decisions

### 1. Keep the public coach CTA browse-first

**Decision:** Public surfaces will send coach-curious users to `/coaches` first, not directly to `/coach/get-started`.

This reduces auth friction, lets first-time visitors understand the coach value proposition, and matches the plan’s intent to keep coach discovery public while onboarding remains one step deeper.

**Alternative considered:** Link public CTA directly to `/coach/get-started`. Rejected because guests would hit a login wall before understanding the coach offering.

### 2. Reuse existing location-routing builders for court-to-coach pivots

**Decision:** Add a small pure helper in discovery that builds coach discovery links by delegating to the existing coach location-routing utilities and preserving only `q`, `province`, `city`, and `sportId`.

This keeps parity with the existing route model, avoids duplicating pathname rules in components, and makes unit-testing the cross-discovery behavior straightforward.

**Alternative considered:** Build hrefs inline inside `/courts` UI components. Rejected because it would duplicate link translation logic across desktop/mobile header and empty states.

### 3. Use secondary emphasis in shared public chrome

**Decision:** Add `Find Coaches` as a persistent secondary entry in the public navbar, a subtle helper CTA in the landing hero support links, and a lightweight `For Coaches` footer section.

This gives coaches multiple entry points across the arrival journey without disturbing the existing primary actions for courts and owners.

**Alternative considered:** Add a hero-level coach CTA with equal weight to court search. Rejected because it would dilute the current court-first landing intent.

### 4. Re-entry should be coach-aware but not portal-architectural

**Decision:** Signed-in public navbar actions and `/home` quick actions will reuse existing coach setup status to show either `Coach Portal` or `Become a Coach`, but portal preference and portal switcher remain unchanged.

This solves the immediate re-entry problem with low implementation risk and no changes to portal enums or cookies.

**Alternative considered:** Add coach as a third portal everywhere. Rejected because it expands scope into account settings, switcher behavior, and broader IA decisions.

## Risks / Trade-offs

- **[More navbar actions could crowd mobile]** -> Mitigation: keep coach actions terse, secondary, and text-based; preserve owner actions.
- **[Coach links could accidentally carry court-only filters]** -> Mitigation: centralize translation in one helper that accepts only shared fields.
- **[Coach positioning could become too strong on the landing page]** -> Mitigation: keep coach CTAs secondary and avoid hero-primary treatment.
- **[Coach status query could momentarily hide/show shortcuts]** -> Mitigation: render coach-aware shortcuts only once session-aware client data resolves.

## Migration Plan

1. Create the OpenSpec artifacts for the coach-entry-point capability.
2. Implement the shared coach-discovery link helper and add unit coverage for its routing behavior.
3. Update public landing, footer, `/courts`, and signed-in re-entry surfaces to consume the new entry-point rules.
4. Run `pnpm lint` and manually smoke the public and protected routes touched by the change.

Rollback:
- Remove the new helper, coach entry-point UI, and related tests.
- Leave existing coach routes and flows untouched.

## Open Questions

None.
