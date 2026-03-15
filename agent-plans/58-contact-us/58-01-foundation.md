# Phase 1: Foundation

**Dependencies:** None  
**Parallelizable:** No  
**User Stories:** US-58-01

---

## Objective

Establish database schema, environment variables, and the email strategy adapter using Resend.

---

## Modules

### Module 1A: Data model + email strategy

**User Story:** `US-58-01`

#### Directory Structure

```
src/shared/infra/db/schema/
  contact-message.ts
src/shared/infra/email/
  email-service.ts
  resend-email.service.ts
  email.factory.ts
```

#### Data Model

- `contact_message` table with name/email/subject/message, optional userId, requestId
- Delivery fields: resendEmailId, emailSentAt, emailFailedAt, emailError

#### Implementation Steps

1. Add `contact_message` schema and export it from `schema/index.ts`.
2. Add env vars to `src/lib/env/index.ts` and `.env.example`.
3. Implement `EmailServiceStrategy` + `ResendEmailService` adapter.

#### Testing Checklist

- [ ] Schema compiles in TypeScript
- [ ] Resend service can instantiate with `RESEND_API_KEY`
- [ ] Env validation passes with new server vars

---

## Phase Completion Checklist

- [ ] Schema added + exported
- [ ] Email strategy adapter implemented
- [ ] Env config updated
