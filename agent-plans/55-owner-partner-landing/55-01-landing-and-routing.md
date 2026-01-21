# Phase 1-2: Landing Page + Onboarding Continuation

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-00-09

---

## Objective

Create a shareable public landing page for venue partners and ensure the owner onboarding flow continues to the next step (venue creation) instead of dropping users into the dashboard.

---

## Modules

### Module 1A: Add `/list-your-venue` Page

**User Story:** `US-00-09`

#### Route

- `src/app/(public)/list-your-venue/page.tsx`

#### UX Requirements

- Use the KudosCourts design system (minimal bento, warm neutrals, teal CTA).
- Use a 3-step conversion landing structure adapted to the onboarding sequence.
- Include progress indicators (Step x of y).
- Include an FAQ accordion to reduce support questions.

#### Primary CTA

- Route to `/owner/onboarding?next=/owner/places/new`

---

### Module 1B: Route Public CTAs to `/list-your-venue`

**User Story:** `US-00-09`

#### Targets

- Public navbar "List Your Venue"
- Public footer "List Your Venue"
- Discovery banners (where owners are targeted)

---

### Module 2A: Onboarding `next` Param + Safe Redirect

**User Story:** `US-00-09`

#### Behavior

- Default next step: `/owner/places/new`
- If `next` query param is provided and safe, redirect there when an org exists.
- Safety: only allow internal `/owner/*` paths.

#### Flow Diagram

```text
/list-your-venue
    |
    | Start onboarding
    v
/owner/onboarding?next=/owner/places/new
    |
    | has org
    v
/owner/places/new
```

---

### Module 2B: Update Fallback Onboarding Links

**User Story:** `US-00-09`

Add `next=` to any "Go to onboarding" fallback links so users return to where they intended to go after creating an organization.

---

## Testing Checklist

- [ ] Visit `/list-your-venue` and verify layout on mobile + desktop
- [ ] Click "Start onboarding" (logged out) and verify login redirect preserves continuation
- [ ] Logged in user without org: create org and land on `/owner/places/new`
- [ ] Logged in user with org: visiting `/owner/onboarding?next=/owner/places/new` redirects to `/owner/places/new`
