# Phase 2: Auth Friction Reduction

**Dependencies:** `agent-plans/43-google-oauth-auth/`  
**Parallelizable:** Yes

---

## Objective

Reduce drop-off at the login wall by shipping Google OAuth (server-driven) and adding clear contextual messaging when a user is signing in to complete a booking.

---

## Modules

### Module 2A: Google OAuth

Reference:
- `agent-plans/43-google-oauth-auth/43-01-backend-google-oauth.md`
- `agent-plans/43-google-oauth-auth/43-02-frontend-google-oauth.md`

Acceptance:
- [ ] Login page has "Continue with Google".
- [ ] Register page has "Continue with Google".
- [ ] Callback safely redirects to `next`.

---

### Module 2B: Booking redirect context on auth pages

When the login/register page has `?redirect=...` pointing to a schedule or booking URL:
- Show a short helper line: "You’ll return to your reservation after signing in."
- Keep copy neutral and small; do not add large banners.

Files:
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/components/register-form.tsx`

---

## Testing Checklist

- [ ] Context line only shows when redirect is present.
- [ ] No layout shift on auth pages.
- [ ] Works with Google OAuth + email/password.
