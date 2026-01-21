# Phase 2: Backend API

**Dependencies:** Phase 1 complete  
**Parallelizable:** No  
**User Stories:** US-58-01

---

## Objective

Implement the contact module (DTOs, repository, service, router) with email delivery and rate limiting.

---

## Modules

### Module 2A: Contact module

**User Story:** `US-58-01`

#### Directory Structure

```
src/modules/contact/
  contact.router.ts
  dtos/
    submit-contact-message.dto.ts
    index.ts
  errors/
    contact.errors.ts
  repositories/
    contact-message.repository.ts
  services/
    contact.service.ts
  factories/
    contact.factory.ts
```

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `contact.submit` | Mutation | `{ name, email, subject, message }` | `{ id, submittedAt }` |

#### Flow Diagram

```
Contact form submit
    │
    ▼
Save contact_message
    │
    ▼
Send Resend email
    │
    ├── success → update emailSentAt + resendEmailId
    └── failure → update emailFailedAt + emailError + throw
```

#### Implementation Steps

1. Create Zod schema + DTO types for contact submissions.
2. Add repository methods (create, update).
3. Implement contact service with transaction for insert, email send after commit, and audit logging.
4. Wire router using `rateLimitedProcedure("sensitive")`.
5. Register router in `src/shared/infra/trpc/root.ts`.

#### Testing Checklist

- [ ] Validation rejects invalid email or empty message
- [ ] Contact record saved before email send
- [ ] Email errors are surfaced to client and logged
- [ ] Rate limiting blocks rapid repeat submissions

---

## Phase Completion Checklist

- [ ] Contact module compiled and wired
- [ ] Router added to root
