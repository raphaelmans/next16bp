# Contact Us - Master Plan

## Overview

Deliver a public contact page, footer CTA, email delivery via Resend, and database storage for inbound inquiries.

### Completed Work (if any)

- None

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/58-contact-us/` |
| Design System | See `context.md` |
| ERD | See `context.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Foundation | 1A | No |
| 2 | Backend API | 2A | No |
| 3 | Public UI + CTA | 3A | No |

---

## Module Index

### Phase 1: Foundation

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Data model + email strategy | Dev 1 | `58-01-foundation.md` |

### Phase 2: Backend API

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Contact module (DTOs, repo, service, router) | Dev 1 | `58-02-backend-api.md` |

### Phase 3: Public UI + CTA

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | Contact page + footer CTA + redirect | Dev 1 | `58-03-ui.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 2A, 3A | Full stack delivery |

---

## Dependencies Graph

```
Phase 1 ───── Phase 2 ───── Phase 3
  1A             2A             3A
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Email provider | Resend | Request requirement + simple Node SDK |
| Rate limiting | sensitive tier | Reduce spam on public form |
| Persistence | Save before email | Preserve data even if email send fails |

---

## Document Index

| Document | Description |
|----------|-------------|
| `58-00-overview.md` | This file |
| `58-01-foundation.md` | Schema + env + email strategy |
| `58-02-backend-api.md` | Contact module APIs |
| `58-03-ui.md` | Contact page + footer CTA |
| `contact-us-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] Contact submissions are saved in Postgres
- [ ] Resend email is delivered on successful submission
- [ ] Public contact page passes validation + UX requirements
- [ ] Footer CTA routes to `/contact-us`
- [ ] `/contact` redirects to `/contact-us`
