# Developer 1 Checklist

**Focus Area:** Contact Us feature delivery  
**Modules:** 1A, 2A, 3A

---

## Module 1A: Data model + email strategy

**Reference:** `58-01-foundation.md`  
**User Story:** `US-58-01`

### Setup

- [ ] Add `contact_message` schema + export
- [ ] Add env vars for Resend + contact inbox

### Implementation

- [ ] Implement `EmailServiceStrategy` and `ResendEmailService`
- [ ] Add email factory

### Testing

- [ ] Typecheck schema + env validation

---

## Module 2A: Contact module

**Reference:** `58-02-backend-api.md`  
**User Story:** `US-58-01`

### Implementation

- [ ] Add DTO + Zod schema
- [ ] Build repository + service
- [ ] Wire router and root router

### Testing

- [ ] Validate email send + error path

---

## Module 3A: Public UI + CTA

**Reference:** `58-03-ui.md`  
**User Story:** `US-58-01`

### Implementation

- [ ] Build `/contact-us` page + form
- [ ] Add footer CTA
- [ ] Add `/contact` redirect

### Testing

- [ ] Inline validation + loading state
- [ ] Success confirmation

---

## Final Checklist

- [ ] All modules complete
- [ ] No TypeScript errors
- [ ] Manual QA on contact form
