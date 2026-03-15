# US-00-01: User Authentication Flow

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **user**, I want to **sign up, sign in, and sign out** so that **I can access platform features like reservations and profile management**.

---

## Acceptance Criteria

### Sign Up (Email/Password)

- Given I am on `/register`
- When I submit a valid email and password (min 8 characters)
- Then my account is created and I see "Check your email for confirmation"

### Sign Up (Magic Link)

- Given I am on `/magic-link`
- When I submit a valid email
- Then a magic link is sent and I see "Check your email for the login link"

### Sign In

- Given I am on `/login` with valid credentials
- When I submit the form
- Then I am authenticated and redirected to `/home` (or `?redirect` param if present)

### Sign Out

- Given I am authenticated
- When I click "Sign Out" in the user dropdown
- Then my session is cleared and I am redirected to `/`

### Redirect Preservation

- Given I am on a protected page (e.g., `/courts/123/book/456`) as a guest
- When I am redirected to `/login`
- Then the original URL is preserved in `?redirect` param
- And after successful login I return to that page

---

## Edge Cases

- Invalid email format - Show validation error inline
- Password too short (< 8 chars) - Show validation error inline
- Email already registered - Show "Email already in use" error
- Invalid credentials on login - Show "Invalid email or password" error
- Expired magic link - Show "Link expired, request a new one" with retry CTA
- Network error during auth - Show toast error with retry option

---

## UI Components

| Page | Route | Components |
|------|-------|------------|
| Login | `/login` | LoginForm, links to register/magic-link |
| Register | `/register` | RegisterForm, link to login |
| Magic Link | `/magic-link` | MagicLinkForm, link to login |

---

## References

- PRD: Section 4.1 (Player persona)
- Context: `agent-contexts/00-04-ux-flow-implementation.md`
