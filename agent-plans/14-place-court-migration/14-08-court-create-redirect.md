# Phase 3E: Court Creation Redirect To Setup Wizard

**Dependencies:** Court setup wizard available  
**Parallelizable:** Yes  
**User Stories:** US-14-14

---

## Objective

Ensure new court creation flows land directly in the setup wizard (step 2: hours) and retire `/new` pages from the UX.

---

## Modules

### Module A: Create Wizard Routes

- Add create wizard routes:
  - `/owner/places/:placeId/courts/setup` (place-scoped)
  - `/owner/courts/setup` (org-scoped)
- Use `CourtForm` to create the court.
- On success, redirect to `/owner/places/:placeId/courts/:courtId/setup?step=hours`.

### Module B: Deprecate `/new` Pages

- Redirect `/owner/places/:placeId/courts/new` → `/owner/places/:placeId/courts/setup`.
- Redirect `/owner/courts/new` → `/owner/courts/setup`.
- Update all “Add Court” links to the setup-create routes.

### Module C: Smart Step Default

- When visiting `/owner/places/:placeId/courts/:courtId/setup` without a `step` param:
  - If hours missing → `step=hours`.
  - Else if pricing missing → `step=pricing`.
  - Else → `step=publish`.

---

## Implementation Steps

1. Add `setupCreate` helpers to `appRoutes`.
2. Create the new setup-create pages (place + org).
3. Replace `/new` pages with redirects.
4. Update “Add Court” buttons/links to new setup-create routes.
5. Add smart-step redirect for setup wizard default.

---

## Testing Checklist

- [ ] Creating a court from place-scoped flow lands on `setup?step=hours`.
- [ ] Creating a court from org flow lands on `setup?step=hours`.
- [ ] `/new` URLs redirect to setup-create.
- [ ] Setup wizard default step selects the correct next missing config.
