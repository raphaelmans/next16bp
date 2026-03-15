
## Overview

Add a first-class phone number contact channel for places, then surface it in owner/admin forms and public contact UX alongside existing Viber details. The plan keeps the DB column nullable, with UI defaults handled in forms, and adds Viber deep links with PH normalization.

### Completed Work

- Added `phone_number` column to `place_contact_detail` in `src/shared/infra/db/schema/place.ts`.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/KudosCourts-User-Stories.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| UX Targets | `src/features/owner/components/place-form.tsx`, `src/app/(admin)/admin/courts/new/page.tsx`, `src/app/(public)/places/[placeId]/page.tsx` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Data model + API wiring | 1A | Yes |
| 2 | Forms + public contact UX | 2A | Partial |

---

## Module Index

### Phase 1: Data model + API wiring

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Place contact phone data | Agent | `50-01-data-model-api.md` |

### Phase 2: Forms + public contact UX

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Phone input + actionable contact UI | Agent | `50-02-ui-forms-contact.md` |

---

## Dependencies Graph

```
Phase 1 ──────┬────── Phase 2
             │
             └── Phone input + contact UI
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| DB default | Nullable column (no default) | Matches existing contact fields; avoids empty-string ambiguity |
| Phone format | Local PH `09` input | Matches user expectation and current placeholders |
| Viber deep link | Normalize `09` to `+63` for link | Improves deep link reliability while preserving display format |
| UX pattern | Actionable buttons + copy affordance | Clear CTA on mobile; copy for desktop |

---

## Document Index

| Document | Description |
|----------|-------------|
| `50-00-overview.md` | Master plan |
| `50-01-data-model-api.md` | Phase 1 details |
| `50-02-ui-forms-contact.md` | Phase 2 details |
| `place-contact-phone-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] `phone_number` accepted in place/admin create/update endpoints.
- [ ] Owner/admin forms show Phone Number beside Viber.
- [ ] Public contact card exposes phone and Viber as actionable + copyable.
- [ ] Lint/build pass.
