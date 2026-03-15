
**Focus Area:** Contact phone data + UI wiring  
**Modules:** 1A, 2A

---

## Module 1A: Place contact phone data

**Reference:** `50-01-data-model-api.md`  
**User Story:** N/A

### Setup

- [ ] Confirm `phone_number` column exists in DB after `db:push`.

### Implementation

- [ ] Add `phoneNumber` to place/admin DTOs.
- [ ] Include `phoneNumber` in place/admin contact upserts.
- [ ] Ensure `place.getById` returns `phoneNumber`.

### Testing

- [ ] Create/update place with phone number.
- [ ] Admin curated create/update stores phone number.

---

## Module 2A: Phone input + actionable contact UI

**Reference:** `50-02-ui-forms-contact.md`  
**User Story:** N/A

### Setup

- [ ] Confirm form components accept `type="tel"` and `autoComplete="tel"`.

### Implementation

- [ ] Add phone inputs to owner/admin forms and batch UI.
- [ ] Add phoneNumber to mutation payloads.
- [ ] Add public contact buttons + copy buttons.
- [ ] Add PH normalization helper for Viber deep link.

### Testing

- [ ] Phone input shows tel keyboard on mobile.
- [ ] Viber deep link uses `+63` normalization.
- [ ] Copy buttons copy displayed number.

### Handoff

- [ ] Update overview if scope changes.
