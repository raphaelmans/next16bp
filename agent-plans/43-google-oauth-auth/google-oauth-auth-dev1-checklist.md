# Developer 1 Checklist

**Focus Area:** Server OAuth + client buttons  
**Modules:** 1A, 1B, 2A, 2B

---

## Module 1A: tRPC Mutation + Auth Service/Repository

**Reference:** `43-01-backend-google-oauth.md`  
**User Story:** `US-00-01`

### Setup

- [ ] Add OAuth DTO schema and export.
- [ ] Add repository method to call `signInWithOAuth`.

### Implementation

- [ ] Add service method to build redirect URL and return provider URL.
- [ ] Add tRPC mutation `auth.loginWithGoogle`.
- [ ] Add auth error if provider URL is missing (optional).

### Testing

- [ ] Mutation returns provider URL.

---

## Module 1B: Callback Exchange + User Role Ensure

**Reference:** `43-01-backend-google-oauth.md`  
**User Story:** `US-00-01`

### Implementation

- [ ] Sanitize `next` to relative path.
- [ ] Create `user_roles` if missing after code exchange.
- [ ] Ignore UserRoleAlreadyExists conflicts.

### Testing

- [ ] Callback completes and redirects to `next`.

---

## Module 2A: Login Form Google Button

**Reference:** `43-02-frontend-google-oauth.md`  
**User Story:** `US-00-01`

### Implementation

- [ ] Add `useLoginWithGoogle` hook.
- [ ] Add Google button with spinner + redirect.

---

## Module 2B: Register Form Google Button

**Reference:** `43-02-frontend-google-oauth.md`  
**User Story:** `US-00-01`

### Implementation

- [ ] Add Google button to register form using the same hook.

---

## Final Checklist

- [ ] `pnpm lint`
- [ ] `pnpm build`
