# Phase 4: Public UI (`/courts/suggest` + CTA)

**Dependencies:** Phase 2 complete  
**Parallelizable:** Yes  
**User Stories:** US-20-01, US-20-04

---

## Objective

Provide a public-facing submission form for authenticated users at `/courts/suggest`, using the public shell.

Provide entry points from the public courts discovery page.

---

## Route

- Create `src/app/(public)/courts/suggest/page.tsx`.
- Enforce authentication inside the page via server-side `requireSession("/courts/suggest")`.
- Render a client form component.

---

## Form

### Layout

- Use `StandardFormProvider`.
- Required fields: name, address, province, city, sports.
- Optional fields: coordinates, timezone, contact fields.
- No notes field.

### Submission UX

- On success:
  - show toast
  - show inline success state on the same page
  - provide “Back to courts” button that routes to `/courts`
  - no auto-redirect timer

---

## CTA Wiring

- Add a “Suggest a court” button on `/courts` page header.
- Add a secondary CTA in empty results state.

### Unauthenticated behavior

- CTA routes to `/login?redirect=/courts/suggest`.

### Authenticated behavior

- CTA routes directly to `/courts/suggest`.
