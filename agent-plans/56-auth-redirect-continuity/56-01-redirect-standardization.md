# Phase 1-2: Redirect Standardization + Metadata

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-00-09, US-00-10

---

## Objective

Add page-specific metadata for `/list-your-venue` and standardize auth redirect behavior across all authentication flows.

---

## Modules

### Module 1A: `/list-your-venue` Metadata

**User Story:** `US-00-09`

#### Files

- `src/app/(public)/list-your-venue/layout.tsx`

#### Requirements

- Add `title`, `description`, `canonical`, `openGraph`, and `twitter` metadata.
- Use the canonical production URL as the base.

---

### Module 1B: Safe Redirect Helper

**User Story:** `US-00-10`

#### Files

- `src/shared/lib/redirects.ts`

#### Requirements

- Normalize the `redirect` param into a safe internal path.
- Accept same-origin absolute URLs and strip to pathname/search/hash.
- Reject external or malformed redirects and fallback to `/home`.

---

### Module 2A: Standardize Redirect Param

**User Story:** `US-00-10`

#### Scope

- Replace `next` with `redirect` for auth flows.
- Update DTOs, router inputs, and client call sites.

---

### Module 2B: Update Auth Callbacks

**User Story:** `US-00-10`

#### Files

- `src/app/auth/callback/route.ts`
- `src/app/auth/confirm/route.ts`
- `src/proxy.ts`

#### Requirements

- Use safe redirect helper in OAuth and email confirmation flows.
- Preserve query/hash in redirect targets.
- Continue to fallback to `/` on error states.

---

## Testing Checklist

- [ ] `/list-your-venue` metadata appears in HTML head
- [ ] Google OAuth returns to `/owner/onboarding?...` when `redirect` is supplied
- [ ] Magic link and signup confirmation return to intended redirect
- [ ] Guest route redirect uses safe internal destination
